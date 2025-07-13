// spells.js
export const SPELLBOOK = [
  {
    name: "Evil Eye",
    school: "Occult",
    baseManaCost: 10,
    scalingMultiplier: 0.2,
    effects: {
      defenseDebuff: { base: 0.1, perMana: 0.003 },  // 10% + 0.3% per extra mana
      duration: { base: 10, perMana: 0.5 }          // 10s + 0.5s per mana
    }
  },
  {
    name: "Astral Projection",
    school: "Astral",
    baseManaCost: 20,
    scalingMultiplier: 0.3,
    effects: {
      duration: { base: 20, perMana: 0.7 },
      auraRadius: { base: 100, perMana: 3 }
    }
  },
  {
    name: "Ethereal Body",
    school: "Astral",
    baseManaCost: 15,
    scalingMultiplier: 0.25,
    effects: {
      damageReduction: { base: 0.1, perMana: 0.004 },
      manaGainPercent: { base: 0.05, perMana: 0.002 },
      duration: { base: 10, perMana: 0.4 }
    },
    combo: {
      with: "Astral Projection",
      transformsTo: "Astral Convergence Aura",
      aura: {
        radiusPerMana: 1,              // extra radius per mana spent
        manaRegenPerAlly: 0.01         // per mana spent
      }
    }
  },
  {
    name: "Veil",
    school: "Illusion",
    baseManaCost: 12,
    scalingMultiplier: 0.2,
    effects: {
      invisibilityLevel: { base: 1, perMana: 0.02 },
      duration: { base: 15, perMana: 0.6 }
    }
  },
  {
    name: "Mystic Ward",
    school: "Protection",
    baseManaCost: 18,
    scalingMultiplier: 0.25,
    effects: {
      shieldAmount: { base: 50, perMana: 2 },
      duration: { base: 20, perMana: 0.5 }
    }
  }
];
