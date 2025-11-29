import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Card,
  CardContent,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  TrendingUp as StatsIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../../Hooks/Tostify";

const AdminAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    position: "left",
    link: "",
    linkTarget: "_blank",
    isActive: true,
    priority: 0,
    startDate: "",
    endDate: "",
    image: null,
  });

  const positions = [
    { value: "left", label: "Left Sidebar" },
    { value: "right", label: "Right Sidebar" },
    { value: "banner", label: "Top Banner" },
    { value: "inline", label: "Inline (Between Products)" },
  ];

  const fetchAds = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/ads/admin/all`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) setAds(data.ads);
    } catch (error) {
      console.error("Fetch ads error:", error);
      showErrorToast("Failed to load ads");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/ads/admin/stats`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) setStats(data);
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  useEffect(() => {
    fetchAds();
    fetchStats();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast("Image must be less than 5MB");
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openCreateDialog = () => {
    setEditingAd(null);
    setFormData({
      title: "",
      position: "left",
      link: "",
      linkTarget: "_blank",
      isActive: true,
      priority: 0,
      startDate: "",
      endDate: "",
      image: null,
    });
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      position: ad.position,
      link: ad.link || "",
      linkTarget: ad.linkTarget || "_blank",
      isActive: ad.isActive,
      priority: ad.priority || 0,
      startDate: ad.startDate ? ad.startDate.split("T")[0] : "",
      endDate: ad.endDate ? ad.endDate.split("T")[0] : "",
      image: null,
    });
    setImagePreview(ad.image);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title) return showErrorToast("Title is required");
    if (!editingAd && !formData.image)
      return showErrorToast("Image is required");

    setSaving(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          formDataToSend.append(key, value);
        }
      });

      const url = editingAd
        ? `${import.meta.env.VITE_SERVER}/api/ads/admin/${editingAd._id}`
        : `${import.meta.env.VITE_SERVER}/api/ads/admin/create`;

      const res = await fetch(url, {
        method: editingAd ? "PUT" : "POST",
        body: formDataToSend,
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        showSuccessToast(
          editingAd ? "Ad updated successfully" : "Ad created successfully"
        );
        setDialogOpen(false);
        fetchAds();
        fetchStats();
      } else {
        showErrorToast(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showErrorToast("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (adId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/ads/admin/${adId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (data.success) {
        showSuccessToast("Ad deleted successfully");
        setDeleteConfirm(null);
        fetchAds();
        fetchStats();
      } else {
        showErrorToast(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showErrorToast("Something went wrong");
    }
  };

  const toggleAdStatus = async (ad) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/ads/admin/${ad._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !ad.isActive }),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (data.success) {
        showSuccessToast(`Ad ${!ad.isActive ? "activated" : "deactivated"}`);
        fetchAds();
      }
    } catch (error) {
      console.error("Toggle error:", error);
      showErrorToast("Failed to update status");
    }
  };

  const calculateCTR = (clicks, impressions) => {
    if (!impressions) return "0.00%";
    return ((clicks / impressions) * 100).toFixed(2) + "%";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircularProgress color="success" />
      </div>
    );
  }

  return (
    <>
      <ToastifyContainer />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Ad Management</h1>
              <p className="text-gray-500">
                Manage sidebar and banner advertisements
              </p>
            </div>
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
            >
              Create New Ad
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Ads</p>
                      <p className="text-2xl font-bold">
                        {stats.overall?.totalAds || 0}
                      </p>
                    </div>
                    <ImageIcon
                      className="text-gray-400"
                      style={{ fontSize: 40 }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Ads</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.overall?.activeAds || 0}
                      </p>
                    </div>
                    <ViewIcon
                      className="text-green-400"
                      style={{ fontSize: 40 }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Total Impressions
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.overall?.totalImpressions?.toLocaleString() || 0}
                      </p>
                    </div>
                    <StatsIcon
                      className="text-blue-400"
                      style={{ fontSize: 40 }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Clicks</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.overall?.totalClicks?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="text-purple-400 text-sm font-medium">
                      CTR:{" "}
                      {calculateCTR(
                        stats.overall?.totalClicks,
                        stats.overall?.totalImpressions
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ADS TABLE */}
          <TableContainer component={Paper} className="shadow-md">
            <Table>
              <TableHead>
                <TableRow className="bg-gray-100">
                  <TableCell>Preview</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Impressions</TableCell>
                  <TableCell>Clicks</TableCell>
                  <TableCell>CTR</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {ads.length > 0 ? (
                  ads.map((ad) => (
                    <TableRow key={ad._id} hover>
                      <TableCell>
                        <img
                          src={ad.image}
                          alt={ad.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">{ad.title}</p>

                          {/* FIXED JSX */}
                          {ad.link && (
                            <a
                              href={ad.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              {ad.link.substring(0, 30)}...
                            </a>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            positions.find(
                              (p) => p.value === ad.position
                            )?.label || ad.position
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        <Switch
                          checked={ad.isActive}
                          onChange={() => toggleAdStatus(ad)}
                          color="success"
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        {ad.impressions?.toLocaleString() || 0}
                      </TableCell>

                      <TableCell>
                        {ad.clicks?.toLocaleString() || 0}
                      </TableCell>

                      <TableCell>
                        {calculateCTR(ad.clicks, ad.impressions)}
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(ad)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirm(ad)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" className="py-8">
                      <ImageIcon
                        style={{ fontSize: 48, color: "#ccc" }}
                      />
                      <p className="text-gray-500 mt-2">No ads found</p>
                      <Button
                        variant="outlined"
                        color="success"
                        onClick={openCreateDialog}
                        className="mt-4"
                      >
                        Create First Ad
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* CREATE / EDIT Dialog */}
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle className="flex justify-between items-center">
              <span>{editingAd ? "Edit Ad" : "Create New Ad"}</span>
              <IconButton onClick={() => setDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <div className="space-y-4">
                {/* IMAGE UPLOAD */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ad Image *
                  </label>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded"
                      />
                    ) : (
                      <div className="py-8">
                        <UploadIcon
                          className="text-gray-400 mx-auto"
                          style={{ fontSize: 48 }}
                        />
                        <p className="text-gray-500 mt-2">
                          Click to upload image
                        </p>
                        <p className="text-xs text-gray-400">
                          Recommended: 160x550 for sidebar
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <TextField
                  label="Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  fullWidth
                />

                <TextField
                  select
                  label="Position *"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  fullWidth
                >
                  {positions.map((pos) => (
                    <MenuItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Link URL"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  fullWidth
                />

                <TextField
                  select
                  label="Link Target"
                  name="linkTarget"
                  value={formData.linkTarget}
                  onChange={handleChange}
                  fullWidth
                >
                  <MenuItem value="_blank">New Tab</MenuItem>
                  <MenuItem value="_self">Same Tab</MenuItem>
                </TextField>

                <TextField
                  label="Priority"
                  name="priority"
                  type="number"
                  value={formData.priority}
                  onChange={handleChange}
                  helperText="Higher priority ads show first"
                  fullWidth
                />

                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />

                  <TextField
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </div>

                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      color="success"
                    />
                  }
                  label="Active"
                />
              </div>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <CircularProgress size={20} />
                ) : editingAd ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* DELETE CONFIRMATION */}
          <Dialog
            open={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
          >
            <DialogTitle>Delete Ad?</DialogTitle>
            <DialogContent>
              <p>Are you sure you want to delete "{deleteConfirm?.title}"?</p>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone.
              </p>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDelete(deleteConfirm._id)}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default AdminAds;
