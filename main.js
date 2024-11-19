import { renderInstallation } from './installation.js';
import { startChuck, g_durs } from './sound.js'

let load3d = true;

document.querySelector("#init-btn").addEventListener("click", e => {
    const introSection = document.querySelector("#intro");
    const installSection = document.querySelector("#installation");
    const footer = document.querySelector("footer");
    if (load3d) renderInstallation();
    startChuck();
    introSection.style = "display: none;"
    installSection.style = "display: initial;"
    footer.innerHTML = "";
    footer.style = "display: none;";
});

// Track duration selection
const g_min_dur_intput = document.querySelector("#min");
g_min_dur_intput.value = g_durs.min;
const g_max_dur_intput = document.querySelector("#max");
g_max_dur_intput.value = g_durs.max;

document.querySelector("#tprova-btn").addEventListener("click", () => {
    g_min_dur_intput.value = g_durs.min = .2;
    g_max_dur_intput.value = g_durs.max = .3;
});
document.querySelector("#tnormal-btn").addEventListener("click", () => {
    g_min_dur_intput.value = g_durs.min = 4;
    g_max_dur_intput.value = g_durs.max = 5;
});

g_min_dur_intput.addEventListener("change", (v) => {
    g_durs.min = parseFloat(v.target.value);
});

g_max_dur_intput.addEventListener("change", (v) => {
    g_durs.max = parseFloat(v.target.value);
});

document.getElementById("load3d").addEventListener("change", () => {
    load3d = !load3d;
});
