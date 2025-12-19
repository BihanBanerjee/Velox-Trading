import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();
const port = process.env.API_PORT || 3005;
app.use(cors({
    credentials: true
}));
/*
cors({ credentials: true }) tells the server to:
Accept cookies, authorization headers, and TLS client certificates from cross-origin requests
Send the Access-Control-Allow-Credentials: true header in responses
Allow the browser to send and receive credentials when making requests from a different origin (domain/port)
*/

app.use(express.json());
app.use(cookieParser());


app.use("/api/v1/user",)


app.listen(port, () => {
    console.log(`API server listening on ${port}`);
});
