/* Uitvaartfoto.nl — gedeelde scripts.
   Geen frameworks, geen tracking. Formulieren versturen via het
   e-mailprogramma van de bezoeker zolang er geen backend/checkout is. */

(function () {
  "use strict";

  var MAIL = "hallo@uitvaartfoto.nl";

  /* --- Contact- en partnerformulieren: mailto opbouwen --- */
  document.querySelectorAll("form.mailform").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var lines = [];
      form.querySelectorAll("input[name], select[name], textarea[name]").forEach(function (el) {
        if (el.value.trim()) lines.push(el.name + ": " + el.value.trim());
      });
      var subject = form.dataset.subject || "Bericht via uitvaartfoto.nl";
      location.href =
        "mailto:" + MAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    });
  });

  /* --- Bestelwizard --- */
  var orderForm = document.getElementById("orderForm");
  if (!orderForm) return;

  var PRODUCTS = {
    "blok-klein":    { label: "Acrylblok Klein · 10 × 15 cm", price: 49, type: "blok" },
    "blok-midden":   { label: "Acrylblok Midden · 15 × 20 cm", price: 79, type: "blok" },
    "blok-groot":    { label: "Acrylblok Groot · 20 × 30 cm", price: 119, type: "blok" },
    "blok-maatwerk": { label: "Acrylblok Maatwerk (25 × 25 t/m 40 × 50 cm)", price: 149, type: "blok", quote: true },
    "plexi-13x18":   { label: "Plexiglas 13 × 18 cm", glans: 39, mat: 42, ezel: 12, type: "plexi" },
    "plexi-20x30":   { label: "Plexiglas 20 × 30 cm", glans: 59, mat: 64, ezel: 16, ophang: 12, type: "plexi" },
    "plexi-30x40":   { label: "Plexiglas 30 × 40 cm", glans: 89, mat: 96, ezel: 22, ophangIncl: true, type: "plexi" },
    "plexi-40x60":   { label: "Plexiglas 40 × 60 cm", glans: 139, mat: 149, ezelRequest: true, ophangIncl: true, type: "plexi" },
    "set-familie":   { label: "Familie-set · 1× blok Groot + 2× blok Klein", price: 199, type: "set" },
    "set-aula":      { label: "Aula-set · plexiglas 30 × 40 glans + ezel, spoed 48 uur", price: 119, type: "set", spoedIncl: true }
  };

  var step = 1;
  var stepsEl = document.getElementById("wizardSteps").children;
  var panes = orderForm.querySelectorAll(".wstep");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var miniTotal = document.getElementById("miniTotal");

  function euro(n) { return "€ " + n; }

  function selectedProduct() {
    var el = orderForm.querySelector('input[name="product"]:checked');
    return el ? { key: el.value, def: PRODUCTS[el.value] } : null;
  }

  function afwerking() {
    var el = orderForm.querySelector('input[name="afwerking"]:checked');
    return el ? el.value : "glans";
  }

  function basePrice(sel) {
    if (!sel) return 0;
    if (sel.def.type === "plexi") return sel.def[afwerking()];
    return sel.def.price;
  }

  function calc() {
    var sel = selectedProduct();
    var rows = [];
    var total = 0;
    if (!sel) return { rows: rows, total: 0, quote: false };
    var base = basePrice(sel);
    var label = sel.def.label + (sel.def.type === "plexi" ? " · " + (afwerking() === "mat" ? "mat" : "glans") : "");
    rows.push([label, sel.def.quote ? "vanaf " + euro(base) : euro(base)]);
    total += base;

    var gravure = document.getElementById("gravure").value.trim();
    if (gravure) { rows.push(["Naam en levensjaren", euro(8)]); total += 8; }

    if (sel.def.ezel && document.getElementById("ezel").checked) {
      rows.push(["Ezel", euro(sel.def.ezel)]); total += sel.def.ezel;
    }
    if (sel.def.ophang && document.getElementById("ophang").checked) {
      rows.push(["Ophangsysteem", euro(sel.def.ophang)]); total += sel.def.ophang;
    }
    if (!sel.def.quote && !sel.def.spoedIncl && document.getElementById("spoed").checked) {
      rows.push(["Spoedverzending", euro(19)]); total += 19;
    }
    if (document.getElementById("restauratie").checked) {
      if (total > 100) rows.push(["Restauratie oude foto", "gratis"]);
      else { rows.push(["Restauratie oude foto", euro(15)]); total += 15; }
    }
    return { rows: rows, total: total, quote: !!sel.def.quote };
  }

  function refreshOptions() {
    var sel = selectedProduct();
    var afw = document.getElementById("afwerkingBlock");
    var optEzel = document.getElementById("optEzel");
    var optOphang = document.getElementById("optOphang");
    var optSpoed = document.getElementById("optSpoed");
    var optNote = document.getElementById("optNote");
    var notes = [];

    if (sel && sel.def.type === "plexi") {
      afw.hidden = false;
      document.getElementById("prijsGlans").textContent = euro(sel.def.glans);
      document.getElementById("prijsMat").textContent = euro(sel.def.mat);
    } else {
      afw.hidden = true;
    }

    optEzel.hidden = !(sel && sel.def.ezel);
    if (sel && sel.def.ezel) {
      document.getElementById("ezelSub").textContent =
        "Houten of acryl staander in dezelfde sobere lijn (+ € " + sel.def.ezel + ")";
    } else {
      document.getElementById("ezel").checked = false;
    }
    if (sel && sel.def.ezelRequest) notes.push("Een ezel bij dit formaat regelen wij op aanvraag — vermeld het bij de opmerkingen.");
    if (sel && sel.def.ophangIncl) notes.push("Het ophangsysteem is bij dit formaat inbegrepen.");
    if (sel && sel.def.type === "blok") notes.push("Acrylblokken staan vanzelf; een ezel is niet nodig.");

    optOphang.hidden = !(sel && sel.def.ophang);
    if (!(sel && sel.def.ophang)) document.getElementById("ophang").checked = false;

    var spoedUit = sel && (sel.def.quote || sel.def.spoedIncl);
    optSpoed.hidden = !!spoedUit;
    if (spoedUit) {
      document.getElementById("spoed").checked = false;
      if (sel.def.quote) notes.push("Maatwerk kent geen spoedoptie; reken op 7–10 werkdagen na akkoord op de proef.");
      if (sel.def.spoedIncl) notes.push("Spoedlevering binnen 48 uur is bij de Aula-set inbegrepen.");
    }

    optNote.hidden = notes.length === 0;
    optNote.textContent = notes.join(" ");
  }

  function refreshSummary() {
    var c = calc();
    var list = document.getElementById("summaryList");
    list.innerHTML = "";
    c.rows.forEach(function (r) {
      var dt = document.createElement("dt"); dt.textContent = r[0];
      var dd = document.createElement("dd"); dd.textContent = r[1];
      list.appendChild(dt); list.appendChild(dd);
    });
    document.getElementById("summaryTotal").textContent = (c.quote ? "vanaf " : "") + euro(c.total);
    document.getElementById("summaryNote").textContent = c.quote
      ? "Maatwerk: wij bevestigen eerst de vaste prijs en sturen een digitale proef. Er wordt niets gedrukt vóór uw akkoord."
      : "Verzending met PostNL Track & Trace is inbegrepen.";
    miniTotal.textContent = c.total ? "Totaal: " + (c.quote ? "vanaf " : "") + euro(c.total) : "";
  }

  function showStep(n) {
    step = n;
    panes.forEach(function (p) { p.classList.toggle("active", +p.dataset.step === n); });
    for (var i = 0; i < stepsEl.length; i++) {
      stepsEl[i].classList.toggle("active", i + 1 === n);
      stepsEl[i].classList.toggle("done", i + 1 < n);
    }
    prevBtn.hidden = n === 1;
    nextBtn.hidden = n === 4;
    if (n >= 3) refreshOptions();
    if (n === 4) refreshSummary();
    document.getElementById("wizardSteps").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function validateStep(n) {
    if (n === 1) {
      var ok = !!selectedProduct();
      document.getElementById("stap1Fout").hidden = ok;
      return ok;
    }
    if (n === 2) {
      var ok2 = document.getElementById("fotoInput").files.length > 0 ||
                document.getElementById("fotoLater").checked;
      document.getElementById("stap2Fout").hidden = ok2;
      return ok2;
    }
    return true;
  }

  nextBtn.addEventListener("click", function () {
    if (validateStep(step)) showStep(step + 1);
  });
  prevBtn.addEventListener("click", function () { showStep(step - 1); });

  orderForm.addEventListener("change", function () {
    refreshOptions();
    refreshSummary();
  });
  document.getElementById("gravure").addEventListener("input", refreshSummary);

  /* Foto-preview + resolutiecontrole. Het bestand blijft lokaal. */
  var fotoInput = document.getElementById("fotoInput");
  fotoInput.addEventListener("change", function () {
    var warn = document.getElementById("fotoWarn");
    var ok = document.getElementById("fotoOk");
    var preview = document.getElementById("fotoPreview");
    var zone = document.getElementById("uploadZone");
    warn.hidden = ok.hidden = preview.hidden = true;
    zone.classList.remove("has-photo");
    var file = fotoInput.files[0];
    if (!file) return;
    document.getElementById("fotoLater").checked = false;
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var short = Math.min(img.naturalWidth, img.naturalHeight);
      preview.src = url;
      preview.hidden = false;
      zone.classList.add("has-photo");
      if (short < 1500) {
        warn.textContent = "Deze foto is " + img.naturalWidth + " × " + img.naturalHeight +
          " pixels — dat is aan de krappe kant. Voor de maten Klein en Midden kan het vaak nog; wij beoordelen het en nemen contact op vóórdat er iets gedrukt wordt.";
        warn.hidden = false;
      } else {
        ok.textContent = "Mooi bestand: " + img.naturalWidth + " × " + img.naturalHeight +
          " pixels. Wij controleren scherpte en uitsnede vóór productie.";
        ok.hidden = false;
      }
    };
    img.onerror = function () {
      warn.textContent = "Dit bestand kunnen we hier niet tonen. Een tiff-bestand kan wel gedrukt worden — stuur het gerust mee of mail het later.";
      warn.hidden = false;
    };
    img.src = url;
  });
  document.getElementById("fotoLater").addEventListener("change", function () {
    if (this.checked) {
      fotoInput.value = "";
      document.getElementById("fotoPreview").hidden = true;
      document.getElementById("fotoOk").hidden = true;
      document.getElementById("fotoWarn").hidden = true;
      document.getElementById("uploadZone").classList.remove("has-photo");
    }
  });

  /* Versturen: bestelling als e-mail (tot de echte checkout er is). */
  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var naam = document.getElementById("b-naam").value.trim();
    var email = document.getElementById("b-email").value.trim();
    var adres = document.getElementById("b-adres").value.trim();
    var postcode = document.getElementById("b-postcode").value.trim();
    var geldig = naam && email && adres && postcode;
    document.getElementById("stap4Fout").hidden = !!geldig;
    if (!geldig) return;

    var c = calc();
    var lines = ["Bestelling via uitvaartfoto.nl", ""];
    c.rows.forEach(function (r) { lines.push(r[0] + " — " + r[1]); });
    lines.push("Totaal incl. btw: " + (c.quote ? "vanaf " : "") + euro(c.total));
    lines.push("");
    var later = document.getElementById("fotoLater").checked;
    var file = fotoInput.files[0];
    lines.push("Foto: " + (later ? "wordt binnen 14 dagen nagestuurd" :
      file ? "als bijlage bij deze e-mail (" + file.name + ")" : "nog onbekend"));
    var gravure = document.getElementById("gravure").value.trim();
    if (gravure) lines.push("Tekst onder de foto: " + gravure);
    lines.push("");
    lines.push("Naam: " + naam);
    lines.push("E-mail: " + email);
    var tel = document.getElementById("b-tel").value.trim();
    if (tel) lines.push("Telefoon: " + tel);
    lines.push("Adres: " + adres + ", " + postcode);
    var code = document.getElementById("b-code").value.trim();
    if (code) lines.push("Partnercode: " + code);
    var opm = document.getElementById("b-opm").value.trim();
    if (opm) lines.push("Opmerkingen: " + opm);
    if (file) {
      lines.push("");
      lines.push("Let op: voeg de gekozen foto als bijlage toe aan deze e-mail.");
    }

    location.href = "mailto:" + MAIL +
      "?subject=" + encodeURIComponent("Bestelling — " + (selectedProduct() ? selectedProduct().def.label : "")) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  });

  /* Voorselectie via ?product=... op productpagina's */
  var pre = new URLSearchParams(location.search).get("product");
  if (pre && PRODUCTS[pre]) {
    var el = orderForm.querySelector('input[name="product"][value="' + pre + '"]');
    if (el) el.checked = true;
  }
  refreshOptions();
  refreshSummary();
})();
