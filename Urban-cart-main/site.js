/* URBAN CART - SHARED SITE ENHANCEMENTS */
(function(){
  var THEME_KEY='urbancart_theme';
  function applyTheme(){
    var dark=localStorage.getItem(THEME_KEY)==='dark';
    document.body.classList.toggle('dark-mode',dark);
    var btn=document.getElementById('theme-toggle');
    if(btn){btn.setAttribute('aria-pressed',String(dark));btn.title=dark?'Switch to light mode':'Switch to dark mode';btn.innerHTML=dark?'☀️':'🌙';}
  }
  function addThemeToggle(){
    var actions=document.querySelector('.navbar-actions');
    if(!actions || document.getElementById('theme-toggle')) return;
    var btn=document.createElement('button');
    btn.id='theme-toggle';btn.className='navbar-icon-btn theme-toggle';btn.type='button';btn.setAttribute('aria-label','Toggle dark mode');
    btn.addEventListener('click',function(){localStorage.setItem(THEME_KEY,document.body.classList.contains('dark-mode')?'light':'dark');applyTheme();});
    var cart=actions.querySelector('#cart-icon');
    if(cart) actions.insertBefore(btn,cart); else actions.appendChild(btn);
    applyTheme();
  }
  function addNavLinks(){
    var nav=document.querySelector('.navbar-nav');
    if(!nav)return;
    var links=[['shop.html','Shop'],['categories.html','Categories'],['profile.html','Account']];
    links.forEach(function(pair){
      if(!nav.querySelector('a[href="'+pair[0]+'"]')){
        var a=document.createElement('a');a.href=pair[0];a.textContent=pair[1];nav.appendChild(a);
      }
    });
  }
  function ensureSearchIcons(){
    document.querySelectorAll('.navbar-search').forEach(function(box){
      if(box.querySelector('.search-icon') || box.querySelector('svg')) return;
      var old=box.querySelector(':scope > span');
      if(old) old.remove();
      var icon=document.createElement('span');
      icon.className='search-icon';
      icon.setAttribute('aria-hidden','true');
      icon.innerHTML='<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"2\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z\"/></svg>';
      box.insertBefore(icon,box.firstChild);
    });
    document.querySelectorAll('.mobile-menu').forEach(function(menu){
      if(!menu.querySelector('.mobile-menu-search')){
        var wrap=document.createElement('div');
        wrap.className='mobile-menu-search';
        wrap.innerHTML='<span class=\"search-icon\" aria-hidden=\"true\"><svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"2\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z\"/></svg></span><input type=\"search\" placeholder=\"Search products...\" aria-label=\"Search products\">';
        menu.insertBefore(wrap,menu.firstChild);
      }
    });
  }
  function bindSearch(){
    ensureSearchIcons();
    document.querySelectorAll('.navbar-search-input,.mobile-menu-search input').forEach(function(input){
      if(input.dataset.searchBound==='1') return;
      input.dataset.searchBound='1';
      input.addEventListener('keydown',function(e){
        if(e.key==='Enter'){
          var q=this.value.trim();
          if(q)location.href='search.html?q='+encodeURIComponent(q);
        }
      });
    });
  }
  function bindHamburger(){
    document.querySelectorAll('.navbar-hamburger').forEach(function(hamburger){
      if(hamburger.dataset.siteBound==='1' || hamburger.dataset.mainBound==='1') return;
      var menu=document.querySelector('.mobile-menu');
      var overlay=document.querySelector('.mobile-overlay');
      if(!menu) return;
      hamburger.dataset.siteBound='1';
      hamburger.addEventListener('click',function(){
        var open=!menu.classList.contains('open');
        hamburger.classList.toggle('active',open);
        menu.classList.toggle('open',open);
        if(overlay) overlay.classList.toggle('show',open);
        document.body.style.overflow=open?'hidden':'';
      });
      if(overlay && overlay.dataset.siteBound!=='1'){
        overlay.dataset.siteBound='1';
        overlay.addEventListener('click',function(){
          hamburger.classList.remove('active');
          menu.classList.remove('open');
          overlay.classList.remove('show');
          document.body.style.overflow='';
        });
      }
      menu.querySelectorAll('a').forEach(function(link){
        link.addEventListener('click',function(){
          hamburger.classList.remove('active');
          menu.classList.remove('open');
          if(overlay) overlay.classList.remove('show');
          document.body.style.overflow='';
        });
      });
    });
  }
  function updateCounters(){
    try{
      var cart=JSON.parse(localStorage.getItem('urbancart_cart')||'[]');
      var wish=JSON.parse(localStorage.getItem('urbancart_wishlist')||'[]');
      var cartCount=cart.reduce(function(t,i){return t+Number(i.quantity||1)},0);
      document.querySelectorAll('.cart-badge').forEach(function(el){el.textContent=cartCount});
      document.querySelectorAll('.wishlist-badge').forEach(function(el){el.textContent=wish.length});
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded',function(){
    addThemeToggle();addNavLinks();bindSearch();bindHamburger();updateCounters();applyTheme();
    window.addEventListener('storage',updateCounters);
  });
  window.updateSiteCounters=updateCounters;
})();
