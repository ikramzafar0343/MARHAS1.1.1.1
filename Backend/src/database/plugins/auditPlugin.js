export const auditFields = {
  deletedAt: { type: Date, default: null, index: true },
  createdBy: { type: String, default: null },
  updatedBy: { type: String, default: null }
};

export const applySoftDelete = (schema) => {
  schema.pre(/^find/, function excludeDeleted() {
    if (this.getOptions().includeDeleted) {
      return;
    }
    this.where({ deletedAt: null });
  });

  schema.methods.softDelete = async function softDelete(userId = null) {
    this.deletedAt = new Date();
    if (userId) {
      this.updatedBy = userId;
    }
    return this.save();
  };

  schema.methods.restore = async function restore(userId = null) {
    this.deletedAt = null;
    if (userId) {
      this.updatedBy = userId;
    }
    return this.save();
  };
};

export const applyAuditHooks = (schema) => {
  schema.pre('save', function setUpdatedBy() {
    if (this.isNew && !this.createdBy && this.updatedBy) {
      this.createdBy = this.updatedBy;
    }
  });
};
