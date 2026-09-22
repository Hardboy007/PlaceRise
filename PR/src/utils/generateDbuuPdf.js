import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generateDbuuPdf(resumeData) {
  const html = buildDbuuHTML(resumeData);

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  try {
    const iDoc = iframe.contentDocument || iframe.contentWindow.document;
    iDoc.open();
    iDoc.write(html);
    iDoc.close();

    // Iframe poora load hone ka wait, fir chhota buffer
    await new Promise((resolve) => {
      if (iDoc.readyState === "complete") resolve();
      else iframe.onload = resolve;
    });
    await new Promise((r) => setTimeout(r, 400));

    const canvas = await html2canvas(iDoc.body, {
      scale: 2,
      useCORS: true,
      width: 794,
      windowWidth: 794,
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Resume preview render nahi ho paaya, dobara try karein");
    }

    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const totalH = canvas.height;
    const totalW = canvas.width;
    const ratio = pdfW / totalW;
    const pageHeightPx = pdfH / ratio;

    let yOffset = 0;
    let pageCount = 0;
    while (yOffset < totalH) {
      const sliceHeight = Math.min(pageHeightPx, totalH - yOffset);
      if (sliceHeight <= 0) break;

      if (pageCount > 0) pdf.addPage();

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = totalW;
      pageCanvas.height = Math.round(sliceHeight);
      const ctx = pageCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, -yOffset);
      const pageImg = pageCanvas.toDataURL("image/jpeg", 0.95);

      pdf.addImage(pageImg, "JPEG", 0, 0, pdfW, pageCanvas.height * ratio);
      yOffset += pageHeightPx;
      pageCount++;
    }

    pdf.save(`${resumeData.name || "resume"}_DBUU.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}

function buildDbuuHTML(data) {
  const {
    name = "",
    email = "",
    phone = "",
    city = "",
    linkedinUrl = "",
    githubUrl = "",
    about = "",
    college = "",
    branch = "",
    cgpa = "",
    batch = "",
    tenthMarks = "",
    twelfthMarks = "",
    skillCategories = [],
    projects = [],
    experience = [],
    achievements = [],
    certifications = [],
  } = data;

  const batchYear = batch ? batch.split(/[-–]/)[1]?.trim() : "";
  const contactParts = [city, phone, email, linkedinUrl, githubUrl].filter(
    Boolean,
  );
  const metaParts = [
    branch ? `B.Tech, ${branch}` : null,
    batch ? `Batch ${batch}` : null,
    college || null,
  ].filter(Boolean);

  const academicRows = [
    {
      degree: `B.Tech (${branch || "—"})`,
      institute: college || "—",
      marks: cgpa || "—",
      year: batchYear ? `${batchYear} (Exp.)` : "—",
    },
    twelfthMarks && {
      degree: "XII (CBSE)",
      institute: "—",
      marks: `${twelfthMarks}%`,
      year: "2023",
    },
    tenthMarks && {
      degree: "X (CBSE)",
      institute: "—",
      marks: `${tenthMarks}%`,
      year: "2021",
    },
  ].filter(Boolean);

  const skillRows = skillCategories.filter((c) => c.label || c.skills);

  const makeBullets = (text) =>
    (text || "")
      .split("\n")
      .filter(Boolean)
      .map((l) => `<li>${l.replace(/^[•▪\-]\s*/, "")}</li>`)
      .join("");

  const projectsHTML = projects
    .map((p) => {
      const allLines = (p.desc || "").split("\n").filter(Boolean);
      const mid = Math.ceil(allLines.length / 2);
      const impactHTML = p.impact
        ? makeBullets(p.impact)
        : makeBullets(allLines.slice(0, mid).join("\n"));
      const deliveryHTML = p.delivery
        ? makeBullets(p.delivery)
        : makeBullets(allLines.slice(mid).join("\n"));
      const techStack = p.subtitle
        ? ` &nbsp;|&nbsp; <span style="font-weight:normal">${p.subtitle}</span>`
        : "";
      const link = p.period || p.link || "";
      const tableRows =
        impactHTML && deliveryHTML
          ? `<tr><td class="label-cell">Impact</td><td><ul>${impactHTML}</ul></td></tr>
           <tr><td class="label-cell">Delivery</td><td><ul>${deliveryHTML}</ul></td></tr>`
          : `<tr><td class="label-cell">Delivery</td><td><ul>${impactHTML || deliveryHTML}</ul></td></tr>`;
      return `
      <div class="project-header-row">
        <div class="project-title">${p.title || "—"}${techStack}</div>
        ${link ? `<div class="project-link">${link}</div>` : ""}
      </div>
      <table class="proj-table">${tableRows}</table>`;
    })
    .join("");

  const experienceHTML = experience
    .map(
      (e) => `
    <div class="project-header-row">
      <div class="project-title">${e.title || "—"}${e.subtitle ? ` &nbsp;|&nbsp; <span style="font-weight:normal">${e.subtitle}</span>` : ""}</div>
      ${e.period ? `<div class="project-link">${e.period}</div>` : ""}
    </div>
    ${e.desc ? `<table class="proj-table"><tr><td class="label-cell">Work</td><td><ul>${makeBullets(e.desc)}</ul></td></tr></table>` : ""}`,
    )
    .join("");

  const achievementsHTML =
    achievements.length > 0
      ? `
    <table class="comp-table">
      ${achievements
        .map(
          (a) => `
        <tr>
          <td class="label-cell">${a.title || "Recognition"}</td>
          <td><ul class="ach-list">${makeBullets(a.desc)}</ul></td>
        </tr>`,
        )
        .join("")}
    </table>`
      : "";

  const certificationsHTML =
    certifications.length > 0
      ? `
    <table class="comp-table">
      ${certifications
        .map(
          (c) => `
        <tr>
          <td class="label-cell">${c.title || "—"}</td>
          <td>${c.subtitle || "—"}</td>
        </tr>`,
        )
        .join("")}
    </table>`
      : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,Helvetica,sans-serif; font-size:9.5pt; color:#000; background:#fff; padding:22px 30px; width:794px; }
    .header-top { display:flex; align-items:center; gap:10px; margin-bottom:5px; }
    .logo-wrap { width:46px; height:46px; flex-shrink:0; }
    .dbuu-univ-name { font-size:8.5pt; font-weight:bold; color:#8B0000; letter-spacing:0.4px; }
    .header-rule { border:none; border-top:1.5px solid #8B0000; margin-bottom:5px; }
    .cv-name { font-size:22pt; font-weight:bold; color:#8B0000; line-height:1.1; margin-bottom:2px; }
    .cv-subtitle { font-size:9.5pt; font-weight:bold; color:#000; margin-bottom:2px; }
    .cv-contact { font-size:8pt; color:#333; margin-bottom:6px; }
    .highlight-banner { background-color:#111; color:#fff; text-align:center; padding:6px 10px; font-size:8.5pt; font-weight:bold; margin-bottom:8px; line-height:1.6; }
    .section-header { background-color:#6B0F1A; color:#fff; font-size:9pt; font-weight:bold; padding:3.5px 7px; margin-top:8px; margin-bottom:0; letter-spacing:0.3px; }
    .academic-table { width:100%; border-collapse:collapse; font-size:9pt; }
    .academic-table th { background-color:#e8e8e8; font-weight:bold; padding:4px 8px; border:1px solid #bbb; text-align:center; }
    .academic-table td { padding:3.5px 8px; border:1px solid #ccc; text-align:center; }
    .academic-table td.left { text-align:left; }
    .comp-table { width:100%; border-collapse:collapse; font-size:9pt; }
    .comp-table td { padding:4.5px 7px; border:1px solid #ddd; vertical-align:top; }
    .label-cell { background-color:#fce8e8 !important; font-weight:bold; color:#6B0F1A !important; width:22%; white-space:nowrap; }
    .project-header-row { display:flex; justify-content:space-between; align-items:baseline; margin-top:7px; margin-bottom:2px; }
    .project-title { font-size:9.5pt; font-weight:bold; color:#000; flex:1; }
    .project-link { font-size:8.5pt; color:#444; font-style:italic; white-space:nowrap; margin-left:12px; }
    .proj-table { width:100%; border-collapse:collapse; font-size:9pt; }
    .proj-table td { padding:4.5px 7px; border:1px solid #ddd; vertical-align:top; }
    .proj-table ul { margin:0; padding:0; list-style:none; }
    .proj-table ul li { position:relative; padding-left:11px; margin-bottom:3px; line-height:1.45; }
    .proj-table ul li::before { content:"▪"; position:absolute; left:0; top:0; }
    .ach-list { margin:0 !important; padding-left:15px !important; list-style:disc !important; }
    .ach-list li { margin-bottom:3px; line-height:1.45; }
  </style></head><body>
    <div class="header-top">
      <div class="logo-wrap">
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="46" height="46">
          <circle cx="24" cy="24" r="22" fill="#fff" stroke="#B8860B" stroke-width="2.5"/>
          <circle cx="24" cy="24" r="17" fill="none" stroke="#B8860B" stroke-width="1"/>
          <text x="24" y="22" text-anchor="middle" font-family="Arial" font-size="9" font-weight="bold" fill="#8B0000">DB</text>
          <text x="24" y="31" text-anchor="middle" font-family="Arial" font-size="7" fill="#8B0000">UU</text>
        </svg>
      </div>
      <div class="dbuu-univ-name">DEV BHOOMI UTTARAKHAND UNIVERSITY</div>
    </div>
    <hr class="header-rule">
    <div class="cv-name">${name.toUpperCase()}</div>
    <div class="cv-subtitle">${metaParts.join(" &nbsp;|&nbsp; ")}</div>
    <div class="cv-contact">${contactParts.join(" &nbsp;|&nbsp; ")}</div>
    ${about ? `<div class="highlight-banner">${about}</div>` : ""}
    <div class="section-header">ACADEMIC RECORD</div>
    <table class="academic-table">
      <thead><tr><th>Degree</th><th>Institute / Board</th><th>% / CGPA</th><th>Year</th></tr></thead>
      <tbody>${academicRows.map((r) => `<tr><td>${r.degree}</td><td class="left">${r.institute}</td><td>${r.marks}</td><td>${r.year}</td></tr>`).join("")}</tbody>
    </table>
    ${
      skillRows.length > 0
        ? `<div class="section-header">CORE COMPETENCIES</div>
    <table class="comp-table">${skillRows.map((cat) => `<tr><td class="label-cell">${(cat.label || "").toUpperCase()}</td><td>${cat.skills || ""}</td></tr>`).join("")}</table>`
        : ""
    }
    ${projects.length > 0 ? `<div class="section-header">PROJECTS</div>${projectsHTML}` : ""}
    ${experience.length > 0 ? `<div class="section-header">EXPERIENCE</div>${experienceHTML}` : ""}
    ${certifications.length > 0 ? `<div class="section-header">CERTIFICATIONS</div>${certificationsHTML}` : ""}
    ${achievements.length > 0 ? `<div class="section-header">ACHIEVEMENTS</div>${achievementsHTML}` : ""}
  </body></html>`;
}