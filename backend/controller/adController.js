const Ad = require("../models/Ad");
const path = require("path");
const fs = require("fs");

// helper: resolve "link" from either field name sent by the two panels
const resolveLink = (body) => body.link ?? body.linkUrl ?? "";

// helper: normalize position values — Adminpanel.jsx uses "left-sidebar"/"right-sidebar"
// but the model and Home.jsx use "left"/"right"
const normalizePosition = (pos) => {
  if (!pos) return "left";
  if (pos === "left-sidebar") return "left";
  if (pos === "right-sidebar") return "right";
  return pos;
};

// ── Get all ads (both panels) ───────────────────────────────────────────────
// AdminPanel.jsx expects: { success, data: [] }
// AdminAds.jsx expects:   { success, ads: [] }
// We return both keys so either panel works.
const getAllAds = async (_req, res) => {
  try {
    const ads = await Ad.find().sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, ads, data: ads });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Ad stats (AdminAds.jsx) ─────────────────────────────────────────────────
const getAdStats = async (_req, res) => {
  try {
    const all = await Ad.find();
    const active = all.filter((a) => a.isActive);

    const overall = {
      totalAds: all.length,
      activeAds: active.length,
      totalImpressions: all.reduce((s, a) => s + (a.impressions || 0), 0),
      totalClicks: all.reduce((s, a) => s + (a.clicks || 0), 0),
    };

    const byPosition = {};
    all.forEach((a) => {
      if (!byPosition[a.position]) {
        byPosition[a.position] = { count: 0, impressions: 0, clicks: 0 };
      }
      byPosition[a.position].count++;
      byPosition[a.position].impressions += a.impressions || 0;
      byPosition[a.position].clicks += a.clicks || 0;
    });

    res.json({ success: true, overall, byPosition });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Create ad ───────────────────────────────────────────────────────────────
const createAd = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const { title, position, linkTarget, isActive, priority, startDate, endDate } = req.body;
    const link = resolveLink(req.body);

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const imageUrl = `/uploads/ads/${req.file.filename}`;

    const ad = await Ad.create({
      title: title.trim(),
      position: normalizePosition(position),
      link,
      linkTarget: linkTarget || "_blank",
      isActive: isActive === "false" || isActive === false ? false : true,
      priority: Number(priority) || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      image: imageUrl,
    });

    res.status(201).json({ success: true, ad, data: ad, message: "Ad created successfully!" });
  } catch (err) {
    console.error("Create ad error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Update ad ───────────────────────────────────────────────────────────────
const updateAd = async (req, res) => {
  try {
    const id = req.params.id || req.params._id;
    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    const { title, position, linkTarget, isActive, priority, startDate, endDate } = req.body;
    const link = resolveLink(req.body);

    if (title !== undefined) ad.title = title;
    if (position !== undefined) ad.position = normalizePosition(position);
    if (link !== "") ad.link = link;
    if (linkTarget !== undefined) ad.linkTarget = linkTarget;
    if (isActive !== undefined) {
      ad.isActive = isActive === "false" || isActive === false ? false : Boolean(isActive);
    }
    if (priority !== undefined) ad.priority = Number(priority);
    if (startDate !== undefined) ad.startDate = startDate || null;
    if (endDate !== undefined) ad.endDate = endDate || null;

    if (req.file) {
      // Delete old image
      const oldPath = path.join(__dirname, "..", ad.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      ad.image = `/uploads/ads/${req.file.filename}`;
    }

    await ad.save();
    res.json({ success: true, ad, data: ad, message: "Ad updated successfully!" });
  } catch (err) {
    console.error("Update ad error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Delete ad ───────────────────────────────────────────────────────────────
const deleteAd = async (req, res) => {
  try {
    const id = req.params.id || req.params._id;
    const ad = await Ad.findByIdAndDelete(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: "Ad not found" });
    }

    const imgPath = path.join(__dirname, "..", ad.image);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

    res.json({ success: true, message: "Ad deleted" });
  } catch (err) {
    console.error("Delete ad error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Public: active ads grouped by position ──────────────────────────────────
const getPublicAds = async (_req, res) => {
  try {
    const now = new Date();
    const query = {
      isActive: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    };

    const ads = await Ad.find(query).sort({ priority: -1 });

    const grouped = { left: [], right: [], banner: [], inline: [] };
    ads.forEach((ad) => {
      if (grouped[ad.position]) grouped[ad.position].push(ad);
    });

    res.json({ success: true, ads: grouped });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Track impression / click ────────────────────────────────────────────────
const trackImpression = async (req, res) => {
  try {
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { impressions: 1 } });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
};

const trackClick = async (req, res) => {
  try {
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
};

module.exports = {
  getAllAds,
  getAdStats,
  createAd,
  updateAd,
  deleteAd,
  getPublicAds,
  trackImpression,
  trackClick,
};
