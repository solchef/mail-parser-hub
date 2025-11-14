import { MappingModel } from "../models/mapping.model.js";

/**
 * Save mapping (create new)
 */
export const saveMapping = async (req, res) => {
    try {
        const m = {
            ...req.body,
            id: req.body.id || `m_${Date.now()}`,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        await MappingModel.create(m);
        res.json(m);
    } catch (error) {
        console.error("Error saving mapping:", error);
        res.status(500).json({ error: "Failed to save mapping" });
    }
};

/**
 * List all mappings
 */
export const listMappings = async (req, res) => {
    try {
        const mappings = await MappingModel.all();
        res.json(mappings || []);
    } catch (error) {
        console.error("Error listing mappings:", error);
        res.status(500).json({ error: "Failed to list mappings" });
    }
};

/**
 * Update mapping by ID
 */
export const updateMapping = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existing = await MappingModel.findById(id);
        if (!existing) {
            return res.status(404).json({ error: "mapping not found" });
        }

        const updated = await MappingModel.patchAndFetchById(id, updateData);
        res.json(updated);
    } catch (error) {
        console.error("Error updating mapping:", error);
        res.status(500).json({ error: "Failed to update mapping" });
    }
};

/**
 * Delete mapping by ID
 */
export const deleteMapping = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);

        const existing = await MappingModel.findById(id);
        if (!existing) {
            return res.status(404).json({ error: "mapping not found" });
        }

        await MappingModel.deleteById(id);

        res.json({ success: true, message: "Mapping deleted successfully" });
    } catch (error) {
        console.error("Error deleting mapping:", error);
        res.status(500).json({ error: "Failed to delete mapping" });
    }
};
