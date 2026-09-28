(() => {
  const $ = (s) => document.querySelector(s);
  const content = $("#content");
  const results = $("#searchResults");
  const modal = $("#modal");
  const modalBody = $("#modalBody");
  const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const yn = window.YIJING || [];
  const ar = window.ARISTOTLE || [];
  const tp = window.TOPICS || [];

  const yById = new Map(yn.map(x=>[x.id,x]));
  const aById = new Map(ar.map(x=>[x.id,x]));

  function tags(list){ return (list||[]).map(x=>'<span class="tag">'+esc(x)+'</span>').join(''); }
  function card(title, body, meta=""){ return '<article class="card"><h3>'+esc(title)+'</h3>'+(meta?'<div class="meta">'+esc(meta)+'</div>':'')+'<div class="body">'+body+'</div></article>'; }

  function home(){
    content.innerHTML = '<h2 class="view-title">当前 V1</h2><p class="view-sub">不是大而全的经典库，而是一个最小可用样品：两套思想来源 + 本地检索 + 12 个预设问题。</p>'+
      '<article class="card item" data-open="topic" data-id="topic-action"><h2>我现在该不该行动？</h2><div class="body">打开一个完整“双视角”样例，比较《周易》与亚里士多德的共同点和差异。</div><div class="tags">'+tags(['时机','选择','行动'])+'</div></article>'+
      '<article class="card item" data-open="yijing" data-id="hex-01"><h2><span class="symbol">䷀</span>乾卦</h2><div class="body">查看卦辞、六爻与当前深度注解样例。</div></article>'+
      '<article class="card item" data-open="aristotle" data-id="ari-practical-wisdom"><h2>实践智慧</h2><div class="body">查看作品定位、现代解释、反思问题和误读边界。</div></article>';
  }

  function yijing(){
    content.innerHTML = '<h2 class="view-title">《周易》六十四卦</h2><p class="view-sub">64卦完整；乾、坤、屯、蒙、需、讼、师、比为 V1 深度注解样例。</p>'+
      yn.map(x=>'<article class="card item" data-open="yijing" data-id="'+esc(x.id)+'"><span class="symbol">'+esc(x.symbol)+'</span><h2>'+x.order+' · '+esc(x.name)+'</h2><div class="meta">上'+esc(x.upper)+' · 下'+esc(x.lower)+' · '+esc(x.annotation_status)+'</div><div class="classic">'+esc(x.judgment)+'</div><div class="body">'+esc(x.oneLine||x.simple||'')+'</div><div class="tags">'+tags(x.keywords)+'</div></article>').join('');
  }

  function aristotle(){
    content.innerHTML = '<h2 class="view-title">亚里士多德</h2><p class="view-sub">22 个思想条目；当前实际涉及《尼各马可伦理学》《政治学》。</p>'+
      ar.map(x=>'<article class="card item" data-open="aristotle" data-id="'+esc(x.id)+'"><h2>'+esc(x.title)+'</h2><div class="meta">'+esc(x.work)+' · '+esc(x.source_locator)+'</div><div class="body">'+esc(x.modernExplanation)+'</div><div class="tags">'+tags(x.keywords)+'</div></article>').join('');
  }

  function topics(){
    content.innerHTML = '<h2 class="view-title">一个问题，两种答案</h2><p class="view-sub">12 个预设主题。这里展示“相似”和“不同”，不替用户作决定。</p>'+
      tp.map(x=>'<article class="card item" data-open="topic" data-id="'+esc(x.id)+'"><h2>'+esc(x.title)+'</h2><div class="split"><div class="body answer">'+esc(x.yijingView)+'</div><div class="body answer contrast">'+esc(x.aristotleView)+'</div></div><div class="tags">'+tags(x.keywords)+'</div></article>').join('');
  }

  function openY(id){
    const x=yById.get(id); if(!x) return;
    const deep = [
      x.situation ? '<div class="deep"><strong>这卦在讨论什么</strong><div class="body">'+esc(x.situation)+'</div></div>' : '',
      x.misconceptions ? '<div class="deep"><strong>容易误读</strong><div class="body">'+esc(Array.isArray(x.misconceptions)?x.misconceptions.join('；'):x.misconceptions)+'</div></div>' : '',
      x.questions ? '<div class="deep"><strong>可以继续问自己</strong><ul class="question-list">'+x.questions.map(q=>'<li>'+esc(q)+'</li>').join('')+'</ul></div>' : ''
    ].join('');
    modalBody.innerHTML='<section class="section"><div class="symbol">'+esc(x.symbol)+'</div><h2 class="view-title">第'+x.order+'卦 · '+esc(x.name)+'</h2><div class="meta">上'+esc(x.upper)+' · 下'+esc(x.lower)+' · '+esc(x.annotation_status)+'</div><div class="tags">'+tags(x.keywords)+'</div></section>'+
      card('卦辞','<div class="classic">'+esc(x.judgment)+'</div>')+
      card('最简单的话',esc(x.simple||x.oneLine||''))+
      '<article class="card"><h3>六爻原文</h3>'+(x.lines||[]).map(l=>'<div class="line"><strong>'+esc(l.label)+'</strong> <span class="classic">'+esc(l.text)+'</span></div>').join('')+'</article>'+
      deep+
      '<article class="card"><h3>来源与权利</h3><div class="meta source">'+esc(x.source_locator||x.source||'')+'</div><div class="body">'+esc(x.rights_note||'')+'</div></article>';
    showModal();
  }

  function openA(id){
    const x=aById.get(id); if(!x) return;
    modalBody.innerHTML='<h2 class="view-title">'+esc(x.title)+'</h2><div class="meta">'+esc(x.work)+' · '+esc(x.source_locator)+'</div><div class="tags">'+tags(x.keywords)+'</div>'+
      card('原思想概述',esc(x.originalThought))+
      card('现代白话',esc(x.modernExplanation))+
      card('反思问题',esc(x.reflection))+
      card('不要误读成',esc(x.misconception))+
      '<article class="card"><h3>来源与权利</h3><div class="body">'+esc(x.rights_note||'')+'</div></article>';
    showModal();
  }

  function openTopic(id){
    const x=tp.find(v=>v.id===id); if(!x) return;
    modalBody.innerHTML='<h2 class="view-title">'+esc(x.title)+'</h2><div class="tags">'+tags(x.keywords)+'</div>'+
      '<article class="card"><h3>《周易》视角</h3><div class="body answer">'+esc(x.yijingView)+'</div><div class="tags">'+x.yijingRefs.map(id=>{const v=yById.get(id);return '<button class="tag item" data-open="yijing" data-id="'+esc(id)+'">'+esc(v?v.name:id)+'</button>';}).join('')+'</div></article>'+
      '<article class="card"><h3>亚里士多德视角</h3><div class="body answer contrast">'+esc(x.aristotleView)+'</div><div class="tags">'+x.aristotleRefs.map(id=>{const v=aById.get(id);return '<button class="tag item" data-open="aristotle" data-id="'+esc(id)+'">'+esc(v?v.title:id)+'</button>';}).join('')+'</div></article>'+
      card('相似',esc(x.similarity))+
      card('不同',esc(x.difference))+
      '<article class="card"><h3>继续思考</h3><ul class="question-list">'+(x.questions||[]).map(q=>'<li>'+esc(q)+'</li>').join('')+'</ul></article>';
    showModal();
  }

  function showModal(){ modal.classList.remove("hidden"); document.body.style.overflow="hidden"; }
  function closeModal(){ modal.classList.add("hidden"); document.body.style.overflow=""; }

  function search(q){
    const s=q.trim().toLowerCase();
    if(!s){results.classList.add("hidden");results.innerHTML="";return;}
    const list=[];
    yn.forEach(x=>{const h=[x.name,x.judgment,x.oneLine,x.simple,...(x.keywords||[]),...(x.lines||[]).map(l=>l.label+l.text)].join(" ").toLowerCase();if(h.includes(s))list.push({kind:"周易",title:x.name,summary:x.oneLine||x.simple,id:x.id,type:"yijing"});});
    ar.forEach(x=>{const h=[x.title,x.work,x.originalThought,x.modernExplanation,x.reflection,x.misconception,...(x.keywords||[])].join(" ").toLowerCase();if(h.includes(s))list.push({kind:"亚里士多德",title:x.title,summary:x.modernExplanation,id:x.id,type:"aristotle"});});
    tp.forEach(x=>{const h=[x.title,x.yijingView,x.aristotleView,x.similarity,x.difference,...(x.keywords||[]),...(x.questions||[])].join(" ").toLowerCase();if(h.includes(s))list.push({kind:"双视角",title:x.title,summary:x.similarity,id:x.id,type:"topic"});});
    results.classList.remove("hidden");
    results.innerHTML='<h2 class="view-title">搜索结果 · '+list.length+'</h2>'+(list.length?list.slice(0,40).map(x=>'<article class="card item" data-open="'+x.type+'" data-id="'+esc(x.id)+'"><div class="result-kind">'+x.kind+'</div><h3>'+esc(x.title)+'</h3><div class="body">'+esc(x.summary||'')+'</div></article>').join(''):'<div class="empty">没有直接命中。当前 H5 镜像只做本地文本搜索。</div>');
  }

  document.addEventListener("click",e=>{
    const el=e.target.closest("[data-open]");
    if(el){ const type=el.dataset.open,id=el.dataset.id; if(type==="yijing")openY(id); else if(type==="aristotle")openA(id); else openTopic(id); return; }
    const tab=e.target.closest("[data-view]");
    if(tab){document.querySelectorAll("[data-view]").forEach(b=>b.classList.remove("active"));tab.classList.add("active"); const v=tab.dataset.view; if(v==="home")home(); else if(v==="yijing")yijing(); else if(v==="aristotle")aristotle(); else topics();}
  });
  $("#modalClose").addEventListener("click",closeModal);
  modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});
  $("#searchInput").addEventListener("input",e=>search(e.target.value));
  $("#clearBtn").addEventListener("click",()=>{$("#searchInput").value="";search("");});
  home();
})();