const container = document.getElementById("particle-container");
const fragment = document.createDocumentFragment();

const count = window.innerWidth < 600 ? 60 : 100;

for (let i = 0; i < count; i++) {
  const p = document.createElement("span");
  p.className = "particle";

  p.style.setProperty("--dim", `${2 + Math.random() * 5}rem`);
  p.style.setProperty("--uplift", `${12 + Math.random() * 20}rem`);
  p.style.setProperty("--pos-x", `${Math.random() * 100}%`);
  p.style.setProperty("--dur", `${3 + Math.random() * 4}s`);
  p.style.setProperty("--delay", `${-Math.random() * 8}s`);

  fragment.appendChild(p);
}

container.appendChild(fragment);
