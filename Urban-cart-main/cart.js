/* ===== URBAN CART - SHOPPING CART MODULE ===== */
(function(){
  var COUPON_KEY='urbancart_coupon';
  var discount=0;
  var couponCode='';

  function money(value){return 'EGB '+Number(value).toFixed(2)}
  function getItems(){return typeof getCart==='function'?getCart():[]}
  function productInfo(id){return typeof PRODUCTS!=='undefined'?(PRODUCTS.find(function(p){return p.id===Number(id)})||null):null}
  function render(){
    var items=getItems(), list=document.getElementById('cart-items'), layout=document.getElementById('cart-content'), empty=document.getElementById('cart-empty');
    var count=items.reduce(function(t,i){return t+i.quantity},0);
    document.getElementById('cart-item-count').textContent=count;
    document.getElementById('cart-panel-count').textContent=count+(count===1?' item':' items');
    if(typeof updateCartCounter==='function')updateCartCounter();

    if(!items.length){
      layout.classList.add('hidden'); empty.classList.remove('hidden'); return;
    }
    layout.classList.remove('hidden'); empty.classList.add('hidden');

    list.innerHTML=items.map(function(item){
      var p=productInfo(item.id)||item;
      return '<article class="cart-item" data-id="'+item.id+'">'+
        '<a class="cart-item-image" href="product-details.html?id='+item.id+'"><img src="'+esc(item.image)+'" alt="'+esc(item.name)+'" loading="lazy" onerror="this.onerror=null;this.src=\''+(esc(item.fallbackImage||'images/products/fallback-home.svg'))+'\'"></a>'+
        '<div><span class="cart-item-category">'+esc(p.category||'Product')+'</span><a class="cart-item-name" href="product-details.html?id='+item.id+'">'+esc(item.name)+'</a><div class="cart-item-meta">'+esc(p.brand||'Urban Cart')+'</div><div class="cart-item-price">'+money(item.price)+'</div></div>'+
        '<div class="cart-item-actions"><div class="quantity-control"><button class="qty-minus" type="button" aria-label="Decrease quantity">−</button><span>'+item.quantity+'</span><button class="qty-plus" type="button" aria-label="Increase quantity">+</button></div><button class="remove-item" type="button" aria-label="Remove item"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12m-9 0v10m6-10v10M9 7l1-3h4l1 3m-8 0h10l-.7 13.1a1 1 0 01-1 .9H8.7a1 1 0 01-1-.9L7 7z"/></svg></button></div>'+
        '<div class="item-total">'+money(item.price*item.quantity)+'</div>'+
      '</article>';
    }).join('');
    bind();
    updateSummary(items);
  }
  function updateSummary(items){
    var subtotal=items.reduce(function(t,i){return t+i.price*i.quantity},0);
    var discountAmount=subtotal*discount;
    var total=Math.max(0,subtotal-discountAmount);
    document.getElementById('summary-subtotal').textContent=money(subtotal);
    document.getElementById('summary-discount').textContent=discountAmount?'-'+money(discountAmount):'EGB 0.00  ';
    document.getElementById('summary-total').textContent=money(total);
  }
  function bind(){
    document.querySelectorAll('.cart-item').forEach(function(row){
      var id=Number(row.dataset.id);
      row.querySelector('.qty-minus').addEventListener('click',function(){changeQty(id,-1)});
      row.querySelector('.qty-plus').addEventListener('click',function(){changeQty(id,1)});
      row.querySelector('.remove-item').addEventListener('click',function(){remove(id)});
    });
  }
  function changeQty(id,delta){
    var items=getItems(), item=items.find(function(i){return Number(i.id)===id});
    if(!item)return;
    item.quantity=Math.max(1,Math.min(99,item.quantity+delta));
    localStorage.setItem('urbancart_cart',JSON.stringify(items));
    render();
  }
  function remove(id){
    var items=getItems().filter(function(i){return Number(i.id)!==id});
    localStorage.setItem('urbancart_cart',JSON.stringify(items));
    if(typeof updateCartCounter==='function')updateCartCounter();
    render();
    if(typeof showToast==='function')showToast('Removed from cart','warning');
  }
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function init(){
    render();
    document.getElementById('clear-cart').addEventListener('click',function(){
      if(!getItems().length)return;
      if(confirm('Clear all items from your cart?')){
        localStorage.removeItem('urbancart_cart');
        render();
        if(typeof showToast==='function')showToast('Cart cleared','success');
      }
    });
    document.getElementById('apply-coupon').addEventListener('click',function(){
      var input=document.getElementById('coupon-input'), msg=document.getElementById('coupon-message'), code=input.value.trim().toUpperCase();
      if(!code){msg.textContent='Enter a promo code.';msg.style.color='var(--color-error)';return}
      if(code==='URBAN10'){
        discount=.10;couponCode=code;msg.textContent='Promo applied — 10% off.';msg.style.color='var(--color-success)';
      }else{
        discount=0;couponCode='';msg.textContent='Invalid promo code.';msg.style.color='var(--color-error)';
      }
      render();
    });
    document.getElementById('checkout-btn').addEventListener('click',function(){
      if(!getItems().length)return;
      location.href='checkout.html';
    });
  }
  document.addEventListener('DOMContentLoaded',init);
})();
