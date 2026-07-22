let cartCount = 0;

function addToCart(){
  cartCount++;
  document.getElementById("cartCount").innerText = cartCount;
}

function filterProducts(){
  let search = document.getElementById("searchInput").value.toLowerCase();
  let category = document.getElementById("categoryFilter").value;
  let price = document.getElementById("priceFilter").value;

  let cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    let name = card.dataset.name.toLowerCase();
    let cat = card.dataset.category;
    let cost = Number(card.dataset.price);

    let searchMatch = name.includes(search);
    let categoryMatch = category === "all" || cat === category;

    let priceMatch = true;

    if(price === "low"){
      priceMatch = cost < 100;
    }
    else if(price === "medium"){
      priceMatch = cost >= 100 && cost <= 500;
    }
    else if(price === "high"){
      priceMatch = cost > 500;
    }

    if(searchMatch && categoryMatch && priceMatch){
      card.style.display = "block";
    }else{
      card.style.display = "none";
    }
  });
}

function openContact(){
  document.getElementById("contactPopup").style.display = "flex";
}

function closeContact(){
  document.getElementById("contactPopup").style.display = "none";
}
