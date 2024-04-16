const express = require ('express');
const mongoose = require('mongoose');
const cors = require('cors');
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error de conexion"));
db.once("open",()=> {
   console.log("Lograste Conexion");
});

const AlumnosSchema = new mongoose.Schema({
  Nombre: String,
  Correo: String,
  Contraseña: String,
  Edad: Number,
}); 

let califSchema = new mongoose.Schema({
    alumnoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumno",
      required: [true, "Property is required"],
    },
    materiaid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Materia",
      required: [true, "Property is required"],
    },
    calificacion: {
      type: Number,
      required: [true, "Property is required"],
    },
  });
let MateriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        ref: "Materia",
        required: [true, "Property is required"],
      },
      Puntos: {
        type: Number,
        ref: "Materia",
        required: [true, "Property is required"],
      },
});
const userSchema = new mongoose.Schema({
    nombre: String,
});
const Calificacion = mongoose.model("Calificaciones", califSchema);
const Usuario = mongoose.model("Usuarios", userSchema);
const Alumno = mongoose.model("Alumno", AlumnosSchema);
const Materia  = mongoose.model("Materia", MateriaSchema);


//Calificaciones// 

app.get("/calificaciones", async (req, res) => {
    try {
      const calificaciones = await Calificacion.find();
  
      let nuevasCalif = await Promise.all(
        calificaciones.map(async (element) => {
          const alumnoInfo = await Alumno.findById(element.alumnoId);
          const materiaInfo = await Materia.findById(element.materiaid);
          return {
            materiaInfo,
            alumnoInfo,
            calificacion: element.calificacion,
          };
        })
      );
  
      res.json(nuevasCalif);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
app.get("/calificaciones/:alumnoId", async (req, res) => {
    try {
      const alumnoId = req.params.alumnoId;
      const calificaciones = await Calificacion.find({ alumnoId });
  
      let nuevasCalif = await Promise.all(
        calificaciones.map(async (element) => {
          const materiaInfo = await Materia.findById(element.materiaid);
          return {
            materiaInfo,
            calificacion: element.calificacion,
          };
        })
      );
      res.json(nuevasCalif);
    } catch (error) {
      console.error("Error al obtener calificaciones:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
app.post("/calificaciones", async (req, res) => {
    try {
      const nuevaCalificacion = new Calificacion (req.body);
      await nuevaCalificacion.save();
      res.status(201).json(nuevaCalificacion);
    }
    catch(error){
        console.log("Error", error);
        res.status(500).json(error,"Error en el servidor");
    }
  }); 
app.put('/calificaciones/:id', async (req, res) => {
  try {
    const calificacionId = req.params.id;
    const nuevaCalificacion = req.body.calificacion;

    
    const calificacionActualizada = await Calificacion.findByIdAndUpdate(
      calificacionId,
      { calificacion: nuevaCalificacion },
      { new: true } 
    );

    
    if (!calificacionActualizada) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    
    res.json(calificacionActualizada);
  } catch (error) {
    console.error('Error al actualizar la calificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
app.delete("/calificaciones/:id", async (req, res) => {
    try {
      const calificacionId = req.params.id;
  
      const calificacion = await Calificacion.findById(calificacionId);
      if (!calificacion) {
        return res.status(404).json({ error: "Calificación no encontrada" });
      }
  
      await calificacion.remove();
  
      res.status(200).json({ message: "Calificación eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar calificación:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

//METODOS CRUD DE LA TABLAUSUARIO//

app.get("/ObtenerAlumnos", async(req, res)=> {
    try{
        const alumnos = await Alumno.find();
        res.json(alumnos);
    } catch (error){
     console.error("Error al Obtener Todos los Alumnos", error);
     res.status(500).json({error:"Error Interno Del Servidor"})
    }
});

app.post("/CrearAlumnos", async (req, res) => {
    try {
        const { Nombre, Correo, Contraseña, Edad } = req.body;
        const nuevoAlumno = new Alumno({ Nombre, Correo, Contraseña, Edad });
        await nuevoAlumno.save();
        res.json({ message: "Alumno registrado correctamente" });
    } catch (error) {
        console.error("Error al registrar alumno:", error);
        res.status(500).json({ error: "Error Interno Del Servidor" });
    }
});

app.put("/ActualizarAlumnos/:id", async(req, res)=> {
    try{
        const alumnoId = req.params.id;
        const { Nombre, Correo, Contraseña, Edad} = req.body;
        const alumnoActualizado = await Alumno.findByIdAndUpdate(alumnoId, { Nombre, Correo, Contraseña, Edad    }, { new: true });
        if (!alumnoActualizado) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }
        res.json({ message: "Alumno Actualizado correctamente" });
    } catch (error){
        console.error("Error al Actualizar Alumno", error);
        res.status(500).json({error:"Error Interno Del Servidor"});
    }
});

app.delete("/EliminarAlumnos/:id", async(req, res)=> {
    try{
        const alumnoId = req.params.id;
        const alumnoEliminado = await Alumno.findByIdAndDelete(alumnoId);
        if (!alumnoEliminado) {
            return res.status(404).json({ error: "Alumno no encontrado" });
        }
        res.json({ message: "Alumno eliminado correctamente" });
    } catch (error){
        console.error("Error al Eliminar Alumno", error);
        res.status(500).json({error:"Error Interno Del Servidor"});
    }
});

//LOGIN
app.post("/IniciarSesion", async (req, res) => {
  try {
      const { Correo, Contraseña } = req.body;
      const alumno = await Alumno.findOne({ Correo, Contraseña });
      if (alumno) {
          res.status(200).json({ message: "Usuario Bienvenido" });
      } else {
          res.status(401).json({ message: "Error de Usuario" });
      }
  } catch (error) {
      console.error("Error al iniciar sesión:", error);
      res.status(500).json({ error: "Error interno del servidor" });
  }
});

//Materias
// Obtener todas las materias
app.get("/materias", async (req, res) => {
  try {
      const materias = await Materia.find();
      res.json(materias);
  } catch (error) {
      console.error("Error al obtener todas las materias:", error);
      res.status(500).json({ error: "Error interno del servidor" });
  }
});
  
const PORT = 8080;
app.listen(PORT, () => {
    console.log('Servidor Funcionando')
});


