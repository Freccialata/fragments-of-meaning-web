import { renderInstallation } from './installation.js';
import { startChuck, g_durs } from './sound.js'

const init_btn = document.querySelector("#init-btn");

init_btn.addEventListener("click", e => {
    const introSection = document.querySelector("#intro");
    const installSection = document.querySelector("#installation");
    const footer = document.querySelector("footer");
    startChuck();
    renderInstallation();
    introSection.style = "display: none;"
    installSection.style = "display: initial;"
    footer.innerHTML = "";
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
    g_min_dur_intput.value = g_durs.min = 61;
    g_max_dur_intput.value = g_durs.max = 70;
});

g_min_dur_intput.addEventListener("change", (v) => {
    g_durs.min = parseFloat(v.target.value);
    
})

g_max_dur_intput.addEventListener("change", (v) => {
    g_durs.max = parseFloat(v.target.value);
})
