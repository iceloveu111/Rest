
// =====================
// 🎯 CAMP + REST + RATION SYSTEM (ONE BUTTON - FULL SYSTEM - Foundry VTT v11/v12 compatible)
// =====================
const campImg = "assets/ID4.png";
const playlistName = "Camp Music";

// เพิ่มปุ่ม Camp Rest เข้า UI
Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  const buttonId = "camp-rest-button";
  const existing = document.getElementById(buttonId);
  if (existing) existing.remove();

  const button = document.createElement("button");
  button.id = buttonId;
  button.textContent = "🔥 Camp Rest";
  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 1000,
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#222",
    color: "white",
    border: "1px solid #999",
    borderRadius: "6px",
    cursor: "pointer"
  });

  button.onclick = () => {
    new Dialog({
      title: "Rest Options",
      content: `<p>Select rest type for all player-controlled tokens in scene:</p>`,
      buttons: {
        short: {
          label: "Short Rest",
          callback: async () => {
            await handleRest("short");
            await showCampSceneAndSheets();
          }
        },
        long: {
          label: "Long Rest",
          callback: async () => {
            await handleRest("long");
            await showCampSceneAndSheets();
          }
        }
      },
      default: "short"
    }).render(true);
  };

  document.body.appendChild(button);
});




// =====================
// 🎯 CAMP + REST + RATION SYSTEM (ONE BUTTON - FULL SYSTEM - Foundry VTT v11/v12 compatible)
// =====================
const campImg = "assets/ID4.png";
const playlistName = "Camp Music";

// เพิ่มปุ่ม Camp Rest เข้า UI
Hooks.once("ready", async () => {
  if (!game.user.isGM) return;

  const buttonId = "camp-rest-button";
  const existing = document.getElementById(buttonId);
  if (existing) existing.remove();

  const button = document.createElement("button");
  button.id = buttonId;
  button.textContent = "🔥 Camp Rest";
  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 1000,
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#222",
    color: "white",
    border: "1px solid #999",
    borderRadius: "6px",
    cursor: "pointer"
  });

  button.onclick = () => {
    new Dialog({
      title: "Rest Options",
      content: `<p>Select rest type for all player-controlled tokens in scene:</p>`,
      buttons: {
        short: {
          label: "Short Rest",
          callback: async () => {
            await handleRest("short");
            await showCampSceneAndSheets();
          }
        },
        long: {
          label: "Long Rest",
          callback: async () => {
            await handleRest("long");
            await showCampSceneAndSheets();
          }
        }
      },
      default: "short"
    }).render(true);
  };

  document.body.appendChild(button);
});



// 📋 รายงานผล Rest หลังจากพักเสร็จ
let restReport = [];

async function handleRest(type) {
  restReport = [];
  for (const token of canvas.tokens.placeables) {
    const actor = token.actor;
    if (!actor || !actor.hasPlayerOwner) continue;

    let usedRation = null;
    for (let i = 0; i < 4; i++) {
      const name = await actor.getFlag("world", `rationSlot${i}`);
      if (!name) continue;
      const item = actor.items.find(it =>
        it.name === name &&
        it.type === "consumable" &&
        it.system.quantity > 0
      );
      if (item) { usedRation = item; break; }
    }

    if (!usedRation) {
      const missed = (actor.getFlag("world", "missedRation") || 0) + 1;
      await actor.setFlag("world", "missedRation", missed);
      restReport.push(`❌ ${actor.name} (ไม่มี Ration${missed >= 2 ? ' - Exhaustion' : ''})`);
      if (missed >= 2) {
        await actor.createEmbeddedDocuments("ActiveEffect", [{
          label: "Exhaustion (No Food)",
          icon: "icons/svg/daze.svg",
          duration: { days: 1 },
          origin: "ration-system"
        }]);
      }
      continue;
    }

    await actor.setFlag("world", "missedRation", 0);
    await usedRation.update({ "system.quantity": usedRation.system.quantity - 1 });

    if (type === "short") {
      const slotBackup = {};
      for (let lvl = 1; lvl <= 9; lvl++) {
        const spell = actor.system.spells?.[`spell${lvl}`];
        if (spell) slotBackup[`spell${lvl}`] = spell.value;
      }
      await actor.shortRest({ dialog: false });
      const restore = {};
      for (let lvl = 1; lvl <= 9; lvl++) {
        if (slotBackup[`spell${lvl}`] !== undefined) {
          restore[`system.spells.spell${lvl}.value`] = slotBackup[`spell${lvl}`];
        }
      }
      await actor.update(restore);
    } else {
      await actor.longRest({ dialog: false });
    }

    if (usedRation.name.toLowerCase().includes("deluxe")) {
      const bonus = type === "short"
        ? (5 + Math.floor(actor.system.attributes.hp.max * 0.1))
        : (10 + Math.floor(actor.system.attributes.hp.max * 0.15));
      const prop = type === "short" ? "system.attributes.hp.temp" : "system.attributes.hp.value";
      const current = getProperty(actor.system, prop);
      const target = type === "short"
        ? bonus
        : Math.min(current + bonus, actor.system.attributes.hp.max);
      await actor.update({ [prop]: target });
    }

    restReport.push(`✅ ${actor.name}`);
  }

  if (restReport.length) {
    const content = `<h3>🔥 สรุปการพัก (${type === "short" ? "Short" : "Long"} Rest)</h3><ul>` +
      restReport.map(line => `<li>${line}</li>`).join("") +
      "</ul>";
    new Dialog({ title: "ผลการพัก", content, buttons: { ok: { label: "ตกลง" } } }).render(true);
  }
}
