const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Conexión a MongoDB
mongoose.connect("mongodb://localhost:27017/pdfManager", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Conexión a MongoDB exitosa"))
  .catch(err => console.error("Error al conectar a MongoDB:", err));

// Esquemas y Modelos
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

const FileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
});

const Category = mongoose.model("Category", CategorySchema);
const File = mongoose.model("File", FileSchema);

// Middleware para verificar permisos
function verifyAdmin(req, res, next) {
  const { username, password } = req.headers;
  if (username === "admin" && password === "123") {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado: Permisos insuficientes" });
}

// Configuración de almacenamiento de PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || "General";
    const categoryPath = `uploads/${category}`;
    if (!fs.existsSync(categoryPath)) fs.mkdirSync(categoryPath, { recursive: true });
    cb(null, categoryPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Rutas

// Crear nueva categoría
app.post("/categories", verifyAdmin, async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: "El nombre de la categoría es obligatorio." });

  try {
    const newCategory = new Category({ name: category });
    await newCategory.save();

    const categoryPath = path.join(__dirname, "uploads", category);
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }

    res.json({ message: `Categoría '${category}' creada exitosamente.` });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    res.status(500).json({ error: "Error al crear categoría." });
  }
});

// Subir un PDF
// Subir un PDF
app.post("/upload", verifyAdmin, upload.single("file"), async (req, res) => {
    const { category } = req.body;
  
    if (!category) {
      return res.status(400).json({ error: "La categoría es obligatoria." });
    }
  
    try {
      // Buscar la categoría en la base de datos
      const categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        return res.status(404).json({ error: "La categoría no existe." });
      }
  
      // Crear documento del archivo
      const fileDoc = new File({
        name: req.file.filename,
        url: `/uploads/${category}/${req.file.filename}`,
        category: categoryDoc._id,
      });
  
      await fileDoc.save();
  
      res.json({ message: "Archivo subido exitosamente.", file: fileDoc });
    } catch (error) {
      console.error("Error al subir archivo:", error);
      res.status(500).json({ error: "Error al subir archivo." });
    }
  });
  

// Obtener archivos por categoría
app.get("/files/:category", verifyAdmin, async (req, res) => {
  try {
    const categoryDoc = await Category.findOne({ name: req.params.category });
    if (!categoryDoc) return res.status(404).json({ error: "Categoría no encontrada." });

    const files = await File.find({ category: categoryDoc._id });
    res.json(files);
  } catch (error) {
    console.error("Error al obtener archivos:", error);
    res.status(500).json({ error: "Error al obtener archivos." });
  }
});

// Eliminar un PDF
app.delete("/files/:id", verifyAdmin, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "Archivo no encontrado." });

    const filePath = path.join(__dirname, "uploads", file.url.split("/uploads/")[1]);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: "Archivo eliminado exitosamente." });
  } catch (error) {
    console.error("Error al eliminar archivo:", error);
    res.status(500).json({ error: "Error al eliminar archivo." });
  }
});

// Eliminar una categoría
// Eliminar una categoría
app.delete("/categories/:name", verifyAdmin, async (req, res) => {
    const { name } = req.params;
  
    try {
      const categoryDoc = await Category.findOne({ name });
      if (!categoryDoc) {
        return res.status(404).json({ error: "Categoría no encontrada." });
      }
  
      // Buscar y eliminar todos los archivos de la categoría
      const files = await File.find({ category: categoryDoc._id });
      for (const file of files) {
        const filePath = path.join(__dirname, "uploads", file.url.split("/uploads/")[1]);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Eliminar archivo físico
        }
        await File.findByIdAndDelete(file._id); // Eliminar archivo de la base de datos
      }
  
      // Eliminar la carpeta de la categoría
      const categoryPath = path.join(__dirname, "uploads", name);
      if (fs.existsSync(categoryPath)) {
        fs.rmdirSync(categoryPath, { recursive: true });
      }
  
      // Eliminar la categoría de la base de datos
      await Category.findByIdAndDelete(categoryDoc._id);
  
      res.json({ message: `Categoría '${name}' y sus archivos fueron eliminados exitosamente.` });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      res.status(500).json({ error: "Error al eliminar categoría." });
    }
  });
  

// Obtener todas las categorías
app.get("/categories", verifyAdmin, async (req, res) => {
  try {
    const categories = await Category.find({}, { name: 1 });
    res.json(categories);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ error: "Error al obtener categorías." });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
