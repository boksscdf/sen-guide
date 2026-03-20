import { useState, useEffect, useRef } from "react";

// Calls our own /api/chat serverless function — API key stays on the server.
async function askClaude(userText, systemText) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userText, systemText }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Server error");
  return data.text;
}

const SCENARIOS = [
  { title:"功課大戰與橡皮擦", cat:"學習", color:"#7ECEC6", desc:"返到屋企見個仔坐咗兩個鐘仲係度切橡皮擦，一粒字都冇寫過。明天要交功課...", choices:[
    {t:"拍檯鬧佢：「你係咪想做廢人？再唔寫我撕爛啲書！」",s:40,g:60,msg:"典型的求生反應。恐懼會導致大腦凍結，令他更難啟動學習。"},
    {t:"「我見你寫唔到都好攰。我們先玩3分鐘遊戲，然後一齊諗第一句？」",s:-30,g:0,msg:"✅ 專家點讚：暖機效應。對於ADHD孩子，短暫的遊戲能降低啟動門檻。"},
    {t:"深深吸口氣，由得佢唔寫，準備聽日向老師坦白狀態。",s:10,g:20,msg:"保護關係的妥協。雖然避開衝突，但需面對學校壓力。"},
  ]},
  { title:"地鐵擁擠的尖叫", cat:"公共", color:"#A8D8EA", desc:"地鐵廣播好大聲且人多。個仔突然遮耳尖叫，乘客紛紛露出厭惡目光...", choices:[
    {t:"大聲鬧：「收聲！你嚇親人呀！」並向路人道歉。",s:50,g:70,msg:"你在試圖向大眾交代。但會增加孩子在感官過載時的恐懼。"},
    {t:"立刻在下一站落車，搵安靜角落並提供降噪耳機。",s:-40,g:0,msg:"✅ 專家點讚：物理隔離是第一策略。感官過載是生理痛楚。"},
    {t:"俾個手機佢睇，求佢唔好再叫。",s:20,g:10,msg:"常見生存工具。解決當下尷尬，但可能加重感官負荷。"},
  ]},
  { title:"劏房鄰居敲天花板", cat:"居家", color:"#D4EED0", desc:"夜晚十點，個仔喺度跳床。鄰居敲天花板大罵。你驚到想喊，怕被趕走...", choices:[
    {t:"即刻按住個仔，甚至情緒爆發打咗佢一巴。",s:90,g:100,msg:"反映了生存恐懼。但強制壓抑動覺需求，會導致更大的爆發。"},
    {t:"鋪厚軟墊，引導個仔做「扮樹懶慢爬」等重力感遊戲。",s:-20,g:10,msg:"✅ 專家點讚：利用感覺統合。重力壓覺能穩定過動神經。"},
    {t:"同鄰居嘈返轉頭：「細路仔係咁架啦！」",s:10,g:40,msg:"崩潰邊緣的反擊。雖發洩了壓力，但增加了居住風險。"},
  ]},
  { title:"收到評估報告的一刻", cat:"評估", color:"#B8E8E2", desc:"公立評估寫住自閉症加智力遲緩。你覺得世界末日，覺得個仔一世完咗...", choices:[
    {t:"不斷搵唔同醫生，覺得係診斷錯，想個仔變返「正常」。",s:60,g:40,msg:"否認是哀悼的一部分。但長期否認會延誤早療黃金期。"},
    {t:"喊一場，然後開始加入互助群組學習家居訓練技巧。",s:-10,g:10,msg:"✅ 專家點讚：家長就是最好的治療師。接納特質並爭取資源。"},
    {t:"將所有錢買神藥或無科學根據的療法。",s:30,g:80,msg:"反映了家長的絕望。請回歸具實證的行為訓練。"},
  ]},
  { title:"理髮店的「推剪」恐懼", cat:"生活", color:"#7ECEC6", desc:"推剪一響，個仔就喊到殺豬咁，理髮師很不耐煩...", choices:[
    {t:"幾個人夾硬按住佢剪完佢，覺得男人老狗剪髮唔可以驚。",s:80,g:60,msg:"強行處理會造成創傷記憶，令下一次理髮更難。"},
    {t:"暫停理髮，詢問是否能只用剪刀，並播放動畫。",s:-30,g:0,msg:"✅ 專家點讚：減少噪音刺激是核心。保住孩子對理髮的安全感。"},
    {t:"算了，埋單走人，返屋企自己剪。",s:-10,g:10,msg:"雖然辛苦，但這保護了孩子。這反映了家長的韌性。"},
  ]},
  { title:"親戚聚會的「寵壞論」", cat:"社交", color:"#A8D8EA", desc:"大伯話：「個仔咁皮係你寵壞，我以前打兩嘢就乖。」", choices:[
    {t:"忍氣吞聲，返到屋企對個仔發脾氣。",s:60,g:80,msg:"你將外界壓力轉嫁給孩子，會傷害親子信任。"},
    {t:"堅定回應：「佢大腦發育唔同，打係解決唔到特質問題嘅。」",s:0,g:0,msg:"✅ 專家點讚：為孩子辯護，建立邊界。這是專業權威的表現。"},
    {t:"早走，唔再參加聚會。",s:10,g:20,msg:"雖然保護了情緒但增加了孤立感。建議尋找同路人。"},
  ]},
  { title:"拒絕著校服", cat:"居家", color:"#D4EED0", desc:"領口「好拮」，個仔發脾氣唔肯著，校車就黎到...", choices:[
    {t:"夾硬幫佢著，話佢嬌生養。",s:70,g:50,msg:"觸覺過敏對孩子是真實的痛。強行著會讓他整天焦慮。"},
    {t:"剪晒標籤，或在裡面加純棉打底衫。",s:-30,g:0,msg:"✅ 專家點讚：解決感官源頭。尊重他的觸覺界限。"},
    {t:"今日請假唔返學，費事嘈。",s:10,g:30,msg:"避開衝突雖舒服，但並非長久之計。"},
  ]},
  { title:"默書零分的痛", cat:"學習", color:"#7ECEC6", desc:"辛苦溫咗三晚派返黎零分，你覺得心灰意冷...", choices:[
    {t:"撕爛默書簿，叫佢重抄一百次。",s:90,g:100,msg:"讀寫障礙孩子抄寫是沒用的處罰。"},
    {t:"搵出佢寫啱嘅一兩個字稱讚。",s:-10,g:0,msg:"✅ 專家點讚：建立信心比分數重要。保護微小的學習動力。"},
    {t:"打算以後唔再幫佢溫。",s:30,g:90,msg:"心理過勞的信號。這不是你的錯，請尋求支持。"},
  ]},
  { title:"羨慕人哋個仔", cat:"情緒", color:"#B8E8E2", desc:"見到朋友個仔又乖又拎獎，你忍唔住想喊...", choices:[
    {t:"返去對個仔要求更高。",s:80,g:90,msg:"比較會毀掉親子關係。每個孩子都有自己的節奏。"},
    {t:"肯定自己付出，關注微小進步。",s:-20,g:-10,msg:"✅ 專家點讚：減少社交媒體對比。關注孩子自身的成長。"},
    {t:"唔再同類朋友見面。",s:10,g:20,msg:"保護了情緒但縮窄了圈子。需尋找理解你的社群。"},
  ]},
  { title:"地鐵故障改路", cat:"公共", color:"#A8D8EA", desc:"突然故障轉車，突發改變令ASD個仔喺月台尖叫...", choices:[
    {t:"大聲責備佢無理取鬧。",s:70,g:50,msg:"突發改變對ASD孩子是大腦風暴。責備只會增加混亂。"},
    {t:"出示地圖，視覺化解釋新路線。",s:-30,g:0,msg:"✅ 專家點讚：視覺資訊比語言穩定。重建控制感。"},
    {t:"強行抱走衝入人潮。",s:50,g:40,msg:"解決了通勤但留下轉場創傷。"},
  ]},
  { title:"陌生乘客側目", cat:"公共", color:"#A8D8EA", desc:"巴士上個仔不停搖手發聲，隔壁阿姐狂望...", choices:[
    {t:"用力撳低佢隻手，對住阿姐尷尬笑。",s:40,g:60,msg:"你在向路人交代，但孩子感到的不適是為了平復神經。"},
    {t:"無視阿姐，引導個仔握減壓球。",s:-10,g:0,msg:"✅ 專家點讚：滿足動覺需求但控制空間。要有強大心態。"},
    {t:"下一站落車。",s:20,g:10,msg:"避開了壓力但增加旅程負擔。"},
  ]},
  { title:"執書包大戰", cat:"居家", color:"#D4EED0", desc:"每晚都要搞兩個鐘，書包仲係亂七八糟。", choices:[
    {t:"幫佢執晒算，費事煩。",s:0,g:30,msg:"省了時間，但剝奪了孩子練習執行功能的機會。"},
    {t:"使用檢核清單（Checklist）。",s:-10,g:0,msg:"✅ 專家點讚：結構化提示。建立自主管理能力。"},
    {t:"鬧佢：「咁小事都做唔好！」",s:70,g:80,msg:"執行功能障礙不是懶惰。責難會摧毀自尊。"},
  ]},
  { title:"重複開關燈", cat:"居家", color:"#D4EED0", desc:"個仔沉迷開關燈嘅啪啪聲，搞到跳掣。", choices:[
    {t:"鬧佢：「再玩我打死你！」",s:50,g:40,msg:"感官搜尋行為。威脅無法滿足生理需求。"},
    {t:"提供有類似按壓感的Pop-it。",s:-30,g:0,msg:"✅ 專家點讚：感官轉移。滿足需求但改變方式。"},
    {t:"關掉總掣算數。",s:40,g:60,msg:"極端反應解決了問題但增加了安全隱患。"},
  ]},
  { title:"驚自己老咗", cat:"情緒", color:"#B8E8E2", desc:"睇到新聞講SEN成年人孤獨，你開始驚自己走咗點算。", choices:[
    {t:"拼命儲錢，覺得錢係唯一保障。",s:30,g:0,msg:"錢很重要，但社交網絡和自理能力同樣關鍵。"},
    {t:"建立社區支援圈，培養孩子自理。",s:-10,g:-10,msg:"✅ 專家點讚：長遠規劃包括放手與建立微型社交圈。"},
    {t:"唔敢諗，覺得諗左更崩潰。",s:40,g:60,msg:"典型逃避機制。請尋求專業社工規劃未來。"},
  ]},
  { title:"診所抽血恐懼", cat:"公共", color:"#A8D8EA", desc:"個仔見到針頭已經崩潰倒地，護士黑面。", choices:[
    {t:"幾個人合力按住佢。",s:90,g:70,msg:"強行醫療會留下創傷。這是無奈下的生存反應。"},
    {t:"使用視覺卡預告，並使用鎮痛貼。",s:-20,g:0,msg:"✅ 專家點讚：減少未知恐懼與物理痛感。"},
    {t:"今日唔抽住。",s:20,g:30,msg:"延後了壓力但問題未解決。"},
  ]},
  { title:"手足不公平投訴", cat:"居家", color:"#D4EED0", desc:"細佬話：「點解哥哥可以唔洗碗/玩耐啲手機？」", choices:[
    {t:"鬧細佬：「哥哥生病呀！」",s:40,g:50,msg:"會加深手足間的怨恨，令細佬覺得被忽視。"},
    {t:"解釋大腦差異：「每個人需要唔同。」",s:0,g:0,msg:"✅ 專家點讚：公平不代表相同。教導個體差異。"},
    {t:"俾埋細佬玩，換取安靜。",s:10,g:30,msg:"平息紛爭但破壞了家中原則。"},
  ]},
  { title:"執迷特定物件", cat:"居家", color:"#D4EED0", desc:"出門口一定要帶住嗰架爛車仔，搵唔到就大喊。", choices:[
    {t:"鬧佢：「一架爛車之嘛！」",s:70,g:50,msg:"物件是孩子的安全感來源。否定會崩潰他的世界。"},
    {t:"建立「出門清單」與備用品。",s:-20,g:0,msg:"✅ 專家點讚：結構化預案能減少情緒損耗。"},
    {t:"幫佢搵到返為止，即使遲到。",s:0,g:20,msg:"過度承擔了孩子的情緒責任。"},
  ]},
  { title:"陌生人摸頭", cat:"社交", color:"#7ECEC6", desc:"老人家想示好，突然摸個仔頭，個仔大叫並拍開手。", choices:[
    {t:"鬧個仔：「冇禮貌！」",s:50,g:70,msg:"忽視身體界限。反映了家長的社交壓力。"},
    {t:"代為解釋：「佢唔習慣接觸。」",s:0,g:0,msg:"✅ 專家點讚：保護身體權是正確的邊界教育。"},
    {t:"笑笑口帶過。",s:10,g:10,msg:"減少衝突但未教育對方尊重孩子。"},
  ]},
  { title:"生日會被孤立", cat:"社交", color:"#7ECEC6", desc:"全班生日會，冇人同個仔玩，佢一個人企邊玩手。", choices:[
    {t:"強推佢入去：「去同人玩啦！」",s:60,g:40,msg:"強推會增加社交焦慮。他可能正處於過載。"},
    {t:"陪佢邊緣觀察，搵一個同樣落單嘅細路。",s:-10,g:0,msg:"✅ 專家點讚：平行遊戲是引入社交的第一步。"},
    {t:"提早帶佢走。",s:20,g:40,msg:"切斷了學習機會，但保護了當刻的情緒。"},
  ]},
  { title:"如廁倒退期", cat:"生活", color:"#B8E8E2", desc:"本來學會如廁，突然又尿喺褲度，仲玩尿。", choices:[
    {t:"鬧佢：「醜唔醜呀？」",s:60,g:80,msg:"羞恥感會增加焦慮，反而更難控制生理機能。"},
    {t:"重啟定時上廁所模式，不責備。",s:0,g:0,msg:"✅ 專家點讚：情緒中性。避免孩子獲取負面關注。"},
    {t:"著返尿片，覺得白費心機。",s:20,g:40,msg:"退步是常見的。請保持耐性。"},
  ]},
  { title:"家務做唔完崩潰", cat:"居家", color:"#D4EED0", desc:"照顧仔仲要煮飯洗衫，你覺得自己快要爆。", choices:[
    {t:"死頂，然後對個仔發脾氣。",s:100,g:50,msg:"情緒過度壓抑會導致暴力性爆發。"},
    {t:"接受不完美：「今晚叫外賣，地聽日先掃。」",s:-30,g:20,msg:"✅ 專家點讚：優先排序。保住能量比家務重要。"},
    {t:"要求老公分擔，結果大嘈一場。",s:40,g:20,msg:"分擔是必須的。溝通方式需調整。"},
  ]},
  { title:"超市改位大聲喊", cat:"生活", color:"#B8E8E2", desc:"超市改咗擺位，個仔搵唔到原本零食喺度尖叫。", choices:[
    {t:"鬧佢：「改位之嘛！」",s:60,g:50,msg:"忽視了ASD對穩定環境的強烈依賴。"},
    {t:"一齊搵，更新視覺清單。",s:-20,g:0,msg:"✅ 專家點讚：利用視覺工具輔助轉場。"},
    {t:"即刻離開。",s:10,g:20,msg:"解決尷尬但任務未完成，增加了壓力。"},
  ]},
  { title:"遊樂場推人", cat:"社交", color:"#7ECEC6", desc:"個仔排隊太耐等唔切，突然推倒前面小朋友。", choices:[
    {t:"當眾大聲喝斥道歉。",s:50,g:60,msg:"羞辱會讓衝動控制力更弱。"},
    {t:"暫停遊戲2分鐘，平復後再教規則。",s:-10,g:0,msg:"✅ 專家點讚：即時後果法比大鬧有效。"},
    {t:"帶個仔返屋企。",s:10,g:20,msg:"避開壓力但未教導處理挫折。"},
  ]},
  { title:"圖書館大叫", cat:"公共", color:"#A8D8EA", desc:"喺圖書館個仔突然興奮大叫，全場靜晒望住你。", choices:[
    {t:"即刻按住佢個嘴，驚到出汗。",s:70,g:50,msg:"恐懼引發焦慮。強行按嘴可能導致防禦反應。"},
    {t:"即刻抱佢走廊冷靜。",s:-20,g:0,msg:"✅ 專家點讚：物理撤離是第一步。"},
    {t:"俾糖叫佢收聲。",s:10,g:30,msg:"建立了「大叫就有糖」的錯誤連結。"},
  ]},
  { title:"換新路線崩潰", cat:"公共", color:"#A8D8EA", desc:"平時路維修，要改道，個仔喺街頭尖叫。", choices:[
    {t:"強行抱走。",s:70,g:40,msg:"突發改變對ASD孩子是大腦風暴。"},
    {t:"用地圖或照片解釋新路線。",s:-30,g:0,msg:"✅ 專家點讚：視覺資訊比語言穩定。"},
    {t:"嚇佢：「唔行有怪獸。」",s:50,g:80,msg:"恐嚇教育會導致長遠焦慮。"},
  ]},
  { title:"超市拿不到玩具", cat:"生活", color:"#B8E8E2", desc:"超市換領品冇晒，個仔當眾瞓地尖叫。", choices:[
    {t:"街度打屁股。",s:90,g:80,msg:"體罰會增加挫敗感。反映了你的極限。"},
    {t:"蹲低標籤情緒：「我知道你好失望。」",s:-20,g:0,msg:"✅ 專家點讚：標籤情緒，提供另一出口。"},
    {t:"高價買返俾佢。",s:10,g:30,msg:"逃避了情緒訓練。"},
  ]},
  { title:"藥物副作用發呆", cat:"居家", color:"#D4EED0", desc:"食完藥個仔變好呆唔食野，你心痛想停。", choices:[
    {t:"即刻停藥。",s:40,g:20,msg:"突然停藥有反彈風險。必須諮詢醫生。"},
    {t:"紀錄副作用，約見醫生調整。",s:-10,g:0,msg:"✅ 專家點讚：客觀紀錄是醫療決策的關鍵。"},
    {t:"叫佢忍下。",s:30,g:50,msg:"忽視生理不適會損害親子連結。"},
  ]},
  { title:"拒絕剪指甲", cat:"居家", color:"#D4EED0", desc:"指甲鉗聲令佢極度焦慮，每次都似打仗。", choices:[
    {t:"趁佢瞓左剪。",s:-10,g:10,msg:"有效短期方案但未建立適應。"},
    {t:"改用電動指甲挫。",s:-30,g:0,msg:"✅ 專家點讚：改變感官刺激。滿足其觸覺閾限。"},
    {t:"迫佢剪。",s:80,g:70,msg:"會造成強烈感官創傷。"},
  ]},
  { title:"被老師投訴難管教", cat:"學習", color:"#7ECEC6", desc:"老師打電話投訴個仔成日係堂上大叫走來走去，話係蓄意搗亂...", choices:[
    {t:"返到屋企鬧個仔，叫佢唔好係學校搞事。",s:70,g:60,msg:"孩子的行為多數源於感官或執行需求，責罵無助改善。"},
    {t:"聯絡老師，提供關於SEN的資料，建議訂立班房支援計劃。",s:-20,g:0,msg:"✅ 專家點讚：家校合作是最有效的介入。"},
    {t:"唔理老師，心想佢唔明白SEN。",s:20,g:30,msg:"迴避問題會令情況惡化。溝通仍然重要。"},
  ]},
  { title:"放學後的情緒崩潰", cat:"情緒", color:"#B8E8E2", desc:"個仔每日放學返來都會大喊大叫甚至打人，家人不理解話係壞習慣...", choices:[
    {t:"嚴厲懲罰，認為要立即改正行為。",s:80,g:70,msg:"學校過後是情緒釋放期。懲罰會加重壓抑。"},
    {t:"設立「回家解壓時間」，不說話不要求，讓他自由活動30分鐘。",s:-30,g:0,msg:"✅ 專家點讚：放學後設安全緩衝區。先讓杯子清空再注入新水。"},
    {t:"問個仔係咪有人蝦佢，反而令佢更激動。",s:30,g:40,msg:"言語追問在崩潰期無效。先安頓，後溝通。"},
  ]},
  { title:"失眠哭泣的夜晚", cat:"情緒", color:"#B8E8E2", desc:"孩子終於睡著，你卻躺在床上哭，覺得自己係失敗的家長...", choices:[
    {t:"強逼自己唔好諗，捱到天光。",s:0,g:80,msg:"長期壓抑情緒會累積成抑鬱。你的感受需要出口。"},
    {t:"發一條短訊俾同路家長群：「今晚好難捱」。",s:0,g:-20,msg:"✅ 專家點讚：連結同路人是最快的情緒急救。你不孤單。"},
    {t:"上網搵更多療法，企圖解決所有問題。",s:10,g:60,msg:"凌晨搜尋會加劇焦慮。先照顧自己。"},
  ]},
];

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bgPage:   "#E8F6F4",
  bgApp:    "#F4FAFA",
  bgCard:   "#FFFFFF",
  bgCard2:  "#F9F4EE",
  header:   "#1A4F4E",
  headerSub:"#7ECEC6",
  navBg:    "#F9F4EE",
  navActive:"#2E7D7B",
  navDim:   "#9BBFBA",
  accent:   "#2E7D7B",
  accentSoft:"rgba(46,125,123,0.10)",
  teal:     "#7ECEC6",
  sky:      "#A8D8EA",
  mint:     "#D4EED0",
  seafoam:  "#B8E8E2",
  border:   "#C8E8E4",
  borderSoft:"rgba(126,206,198,0.35)",
  textDark: "#1A4F4E",
  textMid:  "#2E7D7B",
  textBody: "#3A6E6C",
  textDim:  "#9BBFBA",
  gold:     "#E8A45A",
  stressBar:"linear-gradient(90deg,#F4A179,#F4C98A)",
  guiltBar: "linear-gradient(90deg,#7ECEC6,#A8D8EA)",
  btnPrimary:"linear-gradient(135deg,#2E7D7B,#3A9E9B)",
  successBg:"#D4EED0",
  successText:"#1A4F4E",
  infoBg:   "#DEF0F8",
  infoText: "#0C3F5E",
};

function Spin({ color = "white", size = 14 }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size,
      border:`2px solid ${color}40`, borderTopColor:color,
      borderRadius:"50%", animation:"_sp 0.8s linear infinite", flexShrink:0,
    }}/>
  );
}

export default function App() {
  const [tab, setTab]             = useState("list");
  const [scene, setScene]         = useState(null);
  const [stress, setStress]       = useState(50);
  const [guilt, setGuilt]         = useState(30);
  const [solved, setSolved]       = useState(0);
  const [modal, setModal]         = useState(null);
  const [aiReply, setAiReply]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [genInput, setGenInput]   = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [quote, setQuote]         = useState("");
  const [musicOn, setMusicOn]     = useState(false);
  const canvasRef = useRef(null);
  const animRef   = useRef(false);
  const radRef    = useRef(55);
  const growRef   = useRef(true);
  const audioRef  = useRef(null);

  useEffect(() => {
    if (document.getElementById("_sen_kf")) return;
    const s = document.createElement("style");
    s.id = "_sen_kf";
    s.textContent = `@keyframes _sp{to{transform:rotate(360deg)}} * {-webkit-tap-highlight-color:transparent}`;
    document.head.appendChild(s);
  }, []);

  // breathing canvas — teal palette
  useEffect(() => {
    if (tab !== "relax") { animRef.current = false; return; }
    animRef.current = true;
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const frame = () => {
      if (!animRef.current) return;
      ctx.clearRect(0, 0, 220, 220);
      // outer soft ring
      const gOuter = ctx.createRadialGradient(110,110,radRef.current,110,110,radRef.current+22);
      gOuter.addColorStop(0,"rgba(126,206,198,0.18)");
      gOuter.addColorStop(1,"rgba(168,216,234,0)");
      ctx.beginPath(); ctx.arc(110,110,radRef.current+22,0,Math.PI*2);
      ctx.fillStyle=gOuter; ctx.fill();
      // main circle
      const g = ctx.createRadialGradient(110,110,radRef.current/5,110,110,radRef.current);
      g.addColorStop(0,"rgba(184,232,226,0.95)");
      g.addColorStop(0.5,"rgba(126,206,198,0.80)");
      g.addColorStop(1,"rgba(46,125,123,0.25)");
      ctx.beginPath(); ctx.arc(110,110,radRef.current,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
      if (growRef.current) { radRef.current+=0.20; if(radRef.current>=90) growRef.current=false; }
      else { radRef.current-=0.14; if(radRef.current<=52) growRef.current=true; }
      requestAnimationFrame(frame);
    };
    frame();
    setQuote("");
    askClaude(
      "請寫一句溫馨嘅廣東話鼓勵SEN家長，25字內，只回覆那一句話。",
      "你係關愛SEN家長嘅支持者，只回一句鼓勵說話。"
    ).then(q => setQuote(q.trim())).catch(() => setQuote("你每天的堅持，都係孩子最好的禮物。"));
    return () => { animRef.current = false; };
  }, [tab]);

  function openScene(s) {
    setScene(s); setStress(50); setGuilt(30); setTab("scene");
  }

  function pickChoice(c) {
    setStress(v => Math.max(10, Math.min(100, v + (c.s||0))));
    setGuilt(v  => Math.max(10, Math.min(100, v + (c.g||0))));
    setAiReply(""); setModal({ msg: c.msg });
  }

  async function handleAskAI() {
    if (aiLoading || !modal || !scene) return;
    setAiLoading(true); setAiReply("思考中…");
    try {
      const reply = await askClaude(
        `場景：${scene.title}\n描述：${scene.desc}\n\n請用廣東話提供：\n1) 即時可以講嘅說話劇本（2–3句）\n2) 具體行動步驟（2–3點）\n合共150字內。`,
        "你係充滿溫度嘅香港SEN專家治療師，回答要實用具體，用廣東話。"
      );
      setAiReply(reply);
    } catch (e) {
      setAiReply("⚠️ 連線失敗：" + e.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleGenScene() {
    if (genLoading || !genInput.trim()) return;
    setGenLoading(true);
    try {
      const raw = await askClaude(
        `根據以下情況生成SEN場景練習JSON，只回傳JSON對象，不要任何其他文字：\n\n情況：${genInput}\n\n格式：{"cat":"分類","title":"標題","desc":"廣東話描述","choices":[{"t":"反應","msg":"點評","s":數字,"g":數字},{"t":"反應","msg":"點評","s":數字,"g":數字},{"t":"反應","msg":"點評","s":數字,"g":數字}],"color":"#7ECEC6"}`,
        "你係香港SEN專家。s係孩子壓力變化(-50到100)，g係家長心理負擔變化(-20到100)。第二個選項係最佳回應。只回傳JSON。"
      );
      openScene(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch(e) { alert("生成失敗：" + e.message); }
    finally { setGenLoading(false); }
  }

  function toggleMusic() {
    if (!musicOn) {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type="sine"; osc.frequency.value=174.61; // F3 — calm
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime+2);
      osc.connect(gain); gain.connect(ctx.destination); osc.start();
      audioRef.current = { ctx, osc, gain }; setMusicOn(true);
    } else {
      const { ctx, osc, gain } = audioRef.current;
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime+1);
      setTimeout(() => { try { osc.stop(); } catch(_){} }, 1100);
      audioRef.current = null; setMusicOn(false);
    }
  }

  const isScene = tab === "scene";

  // ── shared style helpers
  const card = (borderColor) => ({
    background: T.bgCard,
    border: `0.5px solid ${T.border}`,
    borderLeft: `4px solid ${borderColor || T.teal}`,
    borderRadius: 16,
    padding: "0.9rem 1.1rem",
    marginBottom: "0.6rem",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "box-shadow .18s",
  });

  return (
    <div style={{ background: T.bgPage, minHeight: "100vh", display: "flex", justifyContent: "center", fontFamily: "'Noto Sans TC',system-ui,sans-serif", color: T.textDark }}>
      <style>{`@keyframes _sp{to{transform:rotate(360deg)}}`}</style>

      <div style={{ width: "100%", maxWidth: 480, minHeight: "100vh", background: T.bgApp, display: "flex", flexDirection: "column", boxShadow: "0 0 40px rgba(46,125,123,0.08)" }}>

        {/* ── Header ── */}
        <div style={{ background: T.header, padding: "1.2rem 1.5rem 1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#E0F5F2", letterSpacing: "-0.01em" }}>
                SEN 家長實戰指南 ✨
              </div>
              <div style={{ fontSize: "0.6rem", color: T.headerSub, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: "0.2rem" }}>
                30 Scenarios · AI Expert · Healing
              </div>
            </div>
            <div style={{ background: "rgba(126,206,198,0.18)", border: "0.5px solid rgba(126,206,198,0.35)", borderRadius: 100, padding: "0.35rem 0.9rem", fontSize: "0.65rem", color: T.teal, fontWeight: 700 }}>
              進度 <span style={{ color: T.gold }}>{solved}</span> / {SCENARIOS.length}
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <div style={{ display: "flex", background: T.navBg, borderBottom: `0.5px solid ${T.border}` }}>
          {[["list","場景庫"],["ai-gen","AI 定製場景"],["relax","呼吸空間"]].map(([v, label]) => {
            const active = tab === v || (isScene && v === "list");
            return (
              <button key={v} onClick={() => setTab(v)} style={{
                flex: 1, padding: "0.85rem 0.4rem",
                fontSize: "0.68rem", fontWeight: 700, background: "none", border: "none",
                borderBottom: `2px solid ${active ? T.navActive : "transparent"}`,
                color: active ? T.navActive : T.navDim,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em", transition: "all .2s",
              }}>{label}</button>
            );
          })}
        </div>

        {/* ── List ── */}
        {tab === "list" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
            <div style={{ background: T.mint, border: `0.5px solid ${T.teal}`, borderRadius: 16, padding: "0.85rem 1rem", fontSize: "0.72rem", color: T.textDark, lineHeight: 1.75, marginBottom: "1rem" }}>
              <strong style={{ color: T.accent }}>專家提示：</strong> 選擇一個場景開始練習。透過模擬真實衝突，學習如何在情緒邊緣保持理智，給孩子最合適的支持。
            </div>
            {SCENARIOS.map((s, i) => (
              <div key={i} style={card(s.color)} onClick={() => openScene(s)}>
                <div>
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.textDim, marginBottom: "0.2rem" }}>{s.cat}</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: T.textDark }}>{s.title}</div>
                </div>
                <div style={{ color: T.accent, fontSize: "1rem", fontWeight: 700 }}>→</div>
              </div>
            ))}
          </div>
        )}

        {/* ── AI Gen ── */}
        {tab === "ai-gen" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: 20, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: T.accent, marginBottom: "0.4rem", fontStyle: "italic" }}>✨ 遇到獨特的困難？</div>
              <div style={{ fontSize: "0.72rem", color: T.textDim, lineHeight: 1.75, marginBottom: "1rem" }}>輸入您今日遇到的具體情況，AI 專家會根據香港 SEN 支援背景為您度身規劃一個互動練習。</div>
              <textarea value={genInput} onChange={e => setGenInput(e.target.value)}
                placeholder="例如：今日喺街個仔因為聽唔到巴士廣播而情緒爆發，我覺得好無助..."
                style={{ width: "100%", height: 150, background: T.bgPage, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: "0.9rem 1rem", fontSize: "0.82rem", color: T.textDark, fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.7, marginBottom: "1rem" }}
              />
              <button onClick={handleGenScene} disabled={genLoading} style={{
                width: "100%", padding: "0.95rem", background: genLoading ? T.teal : T.btnPrimary,
                border: "none", borderRadius: 14, color: "white", fontSize: "0.85rem", fontWeight: 700,
                fontFamily: "inherit", cursor: genLoading ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                boxShadow: "0 4px 16px rgba(46,125,123,0.25)",
              }}>
                {genLoading ? <><Spin /><span>專家構思中…</span></> : <span>生成 AI 專屬練習</span>}
              </button>
            </div>
          </div>
        )}

        {/* ── Scene ── */}
        {isScene && scene && (
          <>
            <div style={{ display: "flex", gap: "1.5rem", padding: "0.75rem 1.25rem", background: T.bgCard2, borderBottom: `0.5px solid ${T.border}`, justifyContent: "center" }}>
              {[["孩子壓力", stress, T.stressBar], ["家長心理負擔", guilt, T.guiltBar]].map(([lbl, val, grad]) => (
                <div key={lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textDim }}>{lbl}</div>
                  <div style={{ width: 90, height: 5, background: T.border, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: grad, width: `${val}%`, transition: "width .8s cubic-bezier(.34,1.56,.64,1)" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "1.25rem", flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: "0.75rem", color: T.textDark }}>{scene.title}</div>
              <div style={{ fontSize: "0.82rem", lineHeight: 1.8, color: T.textBody, background: T.infoBg, border: `0.5px solid ${T.sky}`, borderRadius: 16, padding: "1rem", marginBottom: "1.25rem", fontStyle: "italic" }}>{scene.desc}</div>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.textDim, marginBottom: "0.75rem" }}>選擇你的回應</div>
              {scene.choices.map((c, i) => (
                <button key={i} onClick={() => pickChoice(c)} style={{
                  width: "100%", textAlign: "left", background: T.bgCard,
                  border: `0.5px solid ${T.border}`, borderRadius: 16,
                  padding: "0.95rem 1.1rem", marginBottom: "0.6rem",
                  fontSize: "0.82rem", color: T.textDark, cursor: "pointer",
                  fontFamily: "inherit", lineHeight: 1.65, transition: "all .18s",
                  boxShadow: "0 1px 4px rgba(46,125,123,0.06)",
                }}>{c.t}</button>
              ))}
            </div>
            <div style={{ padding: "0.75rem 1.25rem", borderTop: `0.5px solid ${T.border}`, background: T.bgCard2, textAlign: "center" }}>
              <button onClick={() => setTab("list")} style={{ background: "none", border: "none", fontSize: "0.72rem", fontWeight: 700, color: T.textDim, cursor: "pointer", fontFamily: "inherit", padding: "0.5rem 1rem" }}>← 返回場景庫</button>
            </div>
          </>
        )}

        {/* ── Relax ── */}
        {tab === "relax" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem", textAlign: "center", gap: "1.25rem", overflowY: "auto", background: "linear-gradient(180deg,#E8F6F4 0%,#F4FAFA 100%)" }}>
            <canvas ref={canvasRef} width={220} height={220} style={{ borderRadius: "50%" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: T.textDark }}>4-6 靜心呼吸</div>
              <div style={{ fontSize: "0.75rem", color: T.textDim, marginTop: "0.3rem" }}>放下身份，這幾分鐘只屬於你自己</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: T.bgCard, border: `0.5px solid ${T.border}`, padding: "0.5rem 1.1rem", borderRadius: 100 }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", color: T.textDim, textTransform: "uppercase" }}>背景音樂</span>
              <button onClick={toggleMusic} style={{ background: "none", border: "none", fontSize: "0.72rem", fontWeight: 700, color: T.accent, cursor: "pointer", fontFamily: "inherit" }}>
                {musicOn ? "關閉音效 🔇" : "開啟靜心音 🎵"}
              </button>
            </div>
            {quote ? (
              <div style={{ background: T.seafoam, border: `0.5px solid ${T.teal}`, borderRadius: 20, padding: "1rem 1.25rem", fontSize: "0.82rem", color: T.textDark, fontStyle: "italic", lineHeight: 1.85, maxWidth: 300 }}>
                {quote}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: T.textDim }}>
                <Spin color={T.teal} /> AI 生成鼓勵語…
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,60,58,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", backdropFilter: "blur(6px)" }}>
          <div style={{ background: T.bgApp, border: `0.5px solid ${T.border}`, borderRadius: 24, padding: "1.75rem", maxWidth: 380, width: "100%", maxHeight: "88vh", overflowY: "auto", textAlign: "center", boxShadow: "0 20px 60px rgba(26,79,78,0.18)" }}>
            <div style={{ fontSize: "2.2rem", marginBottom: "0.6rem" }}>💡</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: T.textDark, paddingBottom: "0.75rem", borderBottom: `0.5px solid ${T.border}`, marginBottom: "0.75rem" }}>專家深度點評</div>

            {/* static feedback */}
            <div style={{ fontSize: "0.82rem", color: T.textBody, lineHeight: 1.8, textAlign: "left", background: T.bgCard2, borderRadius: 14, padding: "1rem", marginBottom: "1rem", border: `0.5px solid ${T.border}` }}>
              {modal.msg}
            </div>

            {/* AI reply */}
            {(aiReply || aiLoading) && (
              <div style={{ background: T.mint, border: `0.5px solid ${T.teal}`, borderRadius: 14, padding: "1rem", marginBottom: "1rem", textAlign: "left" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: "0.5rem" }}>✨ 專家 AI 具體建議</div>
                {aiLoading
                  ? <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: T.textMid }}><Spin color={T.accent} /> 思考中…</div>
                  : <div style={{ fontSize: "0.8rem", color: T.textDark, lineHeight: 1.85, whiteSpace: "pre-wrap", fontStyle: "italic" }}>{aiReply}</div>
                }
              </div>
            )}

            {/* Ask AI button */}
            <button onClick={handleAskAI} disabled={aiLoading} style={{
              width: "100%", padding: "0.85rem",
              background: T.accentSoft, border: `0.5px solid ${T.teal}`,
              borderRadius: 14, color: T.accent, fontSize: "0.78rem", fontWeight: 700,
              fontFamily: "inherit", cursor: aiLoading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem", marginBottom: "0.75rem", opacity: aiLoading ? 0.6 : 1,
            }}>
              {aiLoading
                ? <><Spin color={T.accent} /><span>AI 思考中…</span></>
                : <span>{aiReply ? "🔄 再次詢問 AI" : "✨ 詢問具體點講/點做 (AI)"}</span>
              }
            </button>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", paddingTop: "0.75rem", borderTop: `0.5px solid ${T.border}` }}>
              <button onClick={() => { setModal(null); setAiReply(""); }} style={{
                padding: "0.75rem", background: T.bgCard, border: `0.5px solid ${T.border}`,
                borderRadius: 12, color: T.textBody, fontSize: "0.75rem", fontWeight: 700,
                fontFamily: "inherit", cursor: "pointer",
              }}>繼續練習</button>
              <button onClick={() => { setModal(null); setAiReply(""); setSolved(n => n+1); setTab("list"); }} style={{
                padding: "0.75rem", background: T.btnPrimary, border: "none",
                borderRadius: 12, color: "white", fontSize: "0.75rem", fontWeight: 700,
                fontFamily: "inherit", cursor: "pointer",
                boxShadow: "0 4px 12px rgba(46,125,123,0.3)",
              }}>完成並返回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
