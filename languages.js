const langs = {
ita: {
    proj_name: "Frammenti di senso",
    proj_sub: "Un software vivente e l'interazione con il pensiero ossessivo e dissociativo",
    cuffia: "Indossa le cuffie&#x1F3A7 per un'esperienza migliore",
    tempi_prova: "Tempi di prova",
    tempi_normali: "Tempi normali",
    tempi_minimo: "Minimo",
    tempi_massimo: "Massimo",
    tempi_minuti_per: "minuti per traccia",
    carica_3d: "Carica 3D",
    init_btn: "Inizia",
    link_to_home: "&#8962; Frammenti di senso &#8617;",
    footer_paragraph: "Creato da <a href=\"https://freccialata.github.io/\" target=\"_blank\">Gianluca Rubino</a><br /> Tesi NABA Milano 2024/2025<br /> Relatore: Prof. Vincenzo Estremo"
},
eng: {
    proj_name: "Fragments of meaning",
    proj_sub: "A living software and the interaction with obsessive and dissociative thoughts",
    cuffia: "Wear headphones&#x1F3A7 for a better experience",
    tempi_prova: "Testing timings",
    tempi_normali: "Normal timings",
    tempi_minimo: "Minimum",
    tempi_massimo: "Maximum",
    tempi_minuti_per: "minutes per track",
    carica_3d: "Load 3D",
    init_btn: "Start",
    link_to_home: "&#8962; Fragments of meaning &#8617;",
    footer_paragraph: "Art Thesis made by <a href=\"https://freccialata.github.io/\" target=\"_blank\">Gianluca Rubino</a><br /> NABA Milan 2024/2025<br /> Supervisor: Prof. Vincenzo Estremo"
}
};

export const flags_lookup = {
    // Images from https://github.com/ashleedawg/flags and converted to base64
    "ita": "<img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAPBAMAAAD9gUllAAAAD1BMVEVtwJXVSVP///8AkkbOKze8+HBSAAAAAnRSTlPHx/co26IAAAAXSURBVAjXYzA2NjZQUlJSdHFxcRiaHABtHCNlXEfbYQAAAABJRU5ErkJggg==\" alt=\"ita_flag\">",
    "eng": "<img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAMCAMAAAC+5dbKAAAAwFBMVEXJEjEAH2jPGzcRM3frvsjcY3bfucXYUWf3xcpqfKbYXHHwytLwt78mQHXbtLtFVnoeOHn87e/y4OTc1+Hx2t+dqcTsrbd6jLFqdqGBcZd7bJTIdovfdYbMZHssPXoiN27S3urj3ue0vtKprMWDkKu/kqicgqDIip90fJzpjJlLZ5nTbILBanrIWXKtUmDy6/DCyNmvtcyWocDIrrLqn6u1n6W0jKOad5doZJBQXI/mf45JVosyT4msfIQoSIS+NkrVIbP2AAAA1ElEQVQY00WPha7DMAxF3dppsjYpM455e8z0/3/1XE3armTLOromkOouQ4s1EeBOxgKrg/sE607QrEDmLgjmYd26ebwEK6y6ViUFsl+U+N7I5zj7DgAx/HoVu3Q6Z/9i4+bR/R4xAPIdh7RWiiRIUlp55Dj+CsC2OeCmkdhnTqyxvkG2nYG7HPI8usxJFWli9AIW4n4eabl54PsX02gnVh/jXuv3Mc1lU+P2xPdjmXifp7c+gCwmcajx+m9YzLxWrsE/NlVvzGC2x7+uNMNg+mXi//wDDkAQBB2ZMggAAAAASUVORK5CYII=\" alt=\"eng_flag\">",
};

const set_starting_language = () => {
    const curr_lang = get_local_preferred_lang() ? get_local_preferred_lang() : navigator.language;
    if (curr_lang.includes("it")) {
        apply_lang("ita");
    } else {
        apply_lang("eng");
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    set_starting_language();
});

export const change_language_chain = () => {
    const curr_lang = document.querySelector("#swap-lang").value;
    const target_lang_str = swap_curr_lang(curr_lang);
    apply_lang(target_lang_str);
    set_local_preferred_lang(target_lang_str);
}

const set_local_preferred_lang = (lang_str) => {
    localStorage.setItem("preferred_lang", lang_str);
}

const get_local_preferred_lang = () => {
    return localStorage.getItem("preferred_lang");
}

const swap_curr_lang = (curr_lang) => {
    if (curr_lang == "ita") {
        curr_lang = "eng";
    } else if (curr_lang == "eng") {
        curr_lang = "ita";
    } else {
        console.warn(curr_lang, "is in an impossible state");
    }
    return curr_lang;
};

const apply_lang = (lang_str) => {
    const btn_lang_swapper = document.querySelector("#swap-lang");
    const lang_dict = langs[lang_str];
    document.title = lang_dict.proj_name;
    document.getElementById("proj_name").innerText = lang_dict.proj_name;
    document.getElementById("proj_sub").innerText = lang_dict.proj_sub;
    document.getElementById("cuffia").innerHTML = lang_dict.cuffia;
    document.getElementById("tprova-btn").innerText = lang_dict.tempi_prova;
    document.getElementById("tnormal-btn").innerText = lang_dict.tempi_normali;
    document.getElementById("tempi_minimo").innerText = lang_dict.tempi_minimo;
    document.getElementById("tempi_massimo").innerText = lang_dict.tempi_massimo;
    for (let element of document.getElementsByClassName("tempi_minuti_per")) element.innerText = lang_dict.tempi_minuti_per;
    document.getElementById("carica_3d").innerText = lang_dict.carica_3d;
    document.getElementById("init-btn").innerText = lang_dict.init_btn;
    document.getElementById("link_to_home").innerHTML = lang_dict.link_to_home;
    document.getElementById("footer_paragraph").innerHTML = lang_dict.footer_paragraph;
    btn_lang_swapper.value = lang_str;
    btn_lang_swapper.innerHTML = flags_lookup[lang_str];
};
