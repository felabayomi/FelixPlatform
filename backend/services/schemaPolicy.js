// Request-local state survives multipart callbacks without affecting other apps.
exports.withExistingSchema = (req, _res, next) => {
    req.formatterExistingSchemaOnly = true;
    next();
};

exports.usesExistingSchema = (req) => req?.formatterExistingSchemaOnly === true;
