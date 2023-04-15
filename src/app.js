import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

const app = express();

app.use(cors());

app.use(express.json());

dotenv.config();

let db;

const mongoClient = new MongoClient(process.env.DATABASE_URL);

mongoClient.connect()
.then(() => db = mongoClient.db())
.catch((error) => console.log(error.message))

app.post("/participants", async (req, res) => {

    const { name } = req.body;

    const participantSchema = joi.object({
        name: joi.string().required()
    })
    const validation = participantSchema.validate(req.body);

    if(validation.error){
        return res.sendStatus(422);
    }

    try{
        const nameAlreadyInUse = await db.collection("participants").findOne({name});

        if(nameAlreadyInUse){
            return res.sendStatus(409);
        }
        
        await db.collection("participants").insertOne({name, lastStatus: Date.now()});

        await db.collection("messages").insertOne({
            from: name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs().format("HH:mm:ss")});

        res.sendStatus(201);
    } catch(error){
        res.status(500).send(error.message);
    }
});

app.get("/participants", async (req, res) => {
    try{
        const participants = await db.collection("participants").find().toArray();
        res.send(participants);
    } catch(error){
        res.status(500).send(error.message);
    }
});

const PORT = 5000;

app.listen(PORT,() => console.log(`Servidor rodando na porta ${PORT}`));