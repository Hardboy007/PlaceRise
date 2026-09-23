import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

async function getLogoBase64() {
  const res = await fetch("/images/dbuu-logo.jpeg");
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function generateDbuuPdf(resumeData) {
  const logoBase64 = await getLogoBase64();
  const html = buildDbuuHTML(resumeData, logoBase64);

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  try {
    const iDoc = iframe.contentDocument || iframe.contentWindow.document;
    iDoc.open();
    iDoc.write(html);
    iDoc.close();

    await new Promise((resolve) => {
      if (iDoc.readyState === "complete") resolve();
      else iframe.onload = resolve;
    });
    await new Promise((r) => setTimeout(r, 1200));

    const canvas = await html2canvas(iDoc.body, {
      scale: 2,
      useCORS: true,
      width: 794,
      windowWidth: 794,
    });

    if (!canvas || !canvas.width || !canvas.height) {
      throw new Error("Failed to render resume preview, please try again.");
    }

    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
      orientation: "portrait",
    });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const totalH = canvas.height;
    const totalW = canvas.width;
    const ratio = pdfW / totalW;
    const pageHeightPx = pdfH / ratio;

    if (
      ![pdfW, pdfH, totalW, totalH, ratio, pageHeightPx].every(Number.isFinite)
    ) {
      throw new Error("PDF size calculation failed (NaN/Infinity).");
    }

    let yOffset = 0;
    let pageCount = 0;
    while (yOffset < totalH) {
      const sliceHeight = Math.min(pageHeightPx, totalH - yOffset);
      if (sliceHeight <= 0) break;
      if (pageCount > 0) pdf.addPage();

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = totalW;
      pageCanvas.height = Math.max(1, Math.round(sliceHeight));
      const ctx = pageCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, -yOffset);
      const pageImg = pageCanvas.toDataURL("image/jpeg", 0.95);
      const imgH = pageCanvas.height * ratio;

      if (!Number.isFinite(imgH) || imgH <= 0) {
        throw new Error(`Page ${pageCount + 1} has invalid height (${imgH})`);
      }

      pdf.addImage(pageImg, "JPEG", 0, 0, pdfW, imgH);
      yOffset += pageHeightPx;
      pageCount++;
    }

    pdf.save(`${resumeData.name || "resume"}_DBUU.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}

function buildDbuuHTML(data, logoBase64 = "") {
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

  const batchYear = batch ? batch.split(/[-–]/).pop()?.trim() : "";
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
          ? `<tr><td class="label-cell">Impact</td><td><ul>${impactHTML}</ul></td></tr><tr><td class="label-cell">Delivery</td><td><ul>${deliveryHTML}</ul></td></tr>`
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
    body { font-family:Arial,Helvetica,sans-serif; font-size:8.5pt; color:#000; background:#fff; padding:18px 26px; width:794px; overflow:hidden; }
    .header-top { display:flex; align-items:center; gap:10px; margin-bottom:5px; }
    .logo-wrap { width:46px; height:46px; flex-shrink:0; }
    .logo-wrap img { width:46px; height:46px; object-fit:contain; }
    .dbuu-univ-name { font-size:8.5pt; font-weight:bold; color:#8B0000; letter-spacing:0.4px; }
    .header-rule { border:none; border-top:1.5px solid #8B0000; margin-bottom:5px; }
    .cv-name { font-size:18pt; font-weight:bold; color:#8B0000; line-height:1.1; margin-bottom:2px; }
    .cv-subtitle { font-size:9.5pt; font-weight:bold; color:#000; margin-bottom:2px; }
    .cv-contact { font-size:8pt; color:#333; margin-bottom:6px; }
    .highlight-banner { background-color:#111; color:#fff; text-align:center; padding:6px 10px; font-size:8.5pt; font-weight:bold; margin-bottom:8px; line-height:1.6; }
    .section-header { background-color:#6B0F1A; color:#fff; font-size:9pt; font-weight:bold; padding:3.5px 7px; margin-top:8px; margin-bottom:0; letter-spacing:0.3px; }
    .academic-table { width:100%; border-collapse:collapse; font-size:9pt; }
    .academic-table th { background-color:#e8e8e8; font-weight:bold; padding:4px 8px; border:1px solid #bbb; text-align:center; }
    .academic-table td { padding:3.5px 8px; border:1px solid #ccc; text-align:center; }
    .academic-table td.left { text-align:left; }
    .comp-table { width:100%; border-collapse:collapse; font-size:9pt; }
    .comp-table td { padding:4.5px 7px; border:1px solid #ddd; vertical-align:top; word-break:break-word; overflow-wrap:break-word; max-width:0; }
    .label-cell { background-color:#fce8e8 !important; font-weight:bold; color:#6B0F1A !important; width:180px; min-width:180px; max-width:180px; }
    .project-header-row { display:flex; justify-content:space-between; align-items:flex-start; margin-top:7px; margin-bottom:2px; gap:8px; }
    .project-title { font-size:8.5pt; font-weight:bold; color:#000; flex:1; min-width:0; word-break:break-word; }
    .project-link { font-size:8.5pt; color:#444; font-style:italic; white-space:nowrap; margin-left:12px; }
    .proj-table { width:100%; border-collapse:collapse; font-size:9pt; }
    .proj-table td { padding:4.5px 7px; border:1px solid #ddd; vertical-align:top; word-break:break-word; overflow-wrap:break-word; }
    .proj-table ul { margin:0; padding:0; list-style:none; }
    .proj-table ul li { position:relative; padding-left:11px; margin-bottom:3px; line-height:1.45; }
    .proj-table ul li::before { content:"▪"; position:absolute; left:0; top:0; }
    .ach-list { margin:0 !important; padding-left:15px !important; list-style:disc !important; }
    .ach-list li { margin-bottom:3px; line-height:1.45; }
  </style></head><body>
    <div class="header-top">
      <div class="logo-wrap">
        <img src="${logoBase64}" width="46" height="46" style="object-fit:contain;" />
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
