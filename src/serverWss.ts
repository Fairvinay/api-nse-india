/* eslint-disable no-console */
import express from 'express'
import http from 'http';
import https from "https";
import swaggerUi from 'swagger-ui-express'
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { print } from 'graphql'
import { loadSchemaSync } from '@graphql-tools/load'
import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { openapiSpecification } from './swaggerDocOptions'
import path from 'path';
import { mainRouter } from './routes'
import cors from 'cors';
import { WebSocketServer } from "ws";
import {  IndicesSocket }from "./mock-wss-server-sequential-type"
import fs from "fs";
//const env = (import.meta as any).env;


const app = express()
let  port = process.env.PORT || 8443 //3065
const hostUrl = process.env.HOST_URL || `http://localhost:${port}`

// CORS Configuration from environment variables
// CORS_ORIGINS: Comma-separated list of allowed origins
// CORS_METHODS: Comma-separated list of allowed HTTP methods  
// CORS_HEADERS: Comma-separated list of allowed headers
// CORS_CREDENTIALS: Enable/disable credentials (default: true)


// SSL Certiicate 
import { fileURLToPath } from 'url';

// Get the current directory using ES module syntax
var privateKey  = fs.readFileSync('ssl-key/server.key', 'utf8');
var certificate = fs.readFileSync('ssl-crt/server.crt', 'utf8');
//const __filename = fileURLToPath(import.meta.url);
const __dirnameAct = path.dirname(__dirname);

 // Define paths to your certificate files
    const privateKeyPath = path.join(__dirnameAct, 'ssl-key/', 'server.key');
    const certificatePath = path.join(__dirnameAct, 'ssl-crt/', 'server.crt');
const startOfMonth = new Date();
 // Read the certificate and private key files
const options = {
        key: fs.readFileSync(privateKeyPath),
        cert: fs.readFileSync(certificatePath)
        // ca: fs.readFileSync(path.join(__dirname, 'cert', 'ca_bundle.crt')) // Optional: if you have a CA bundle
};
 

const httpServer = https.createServer({
  cert: fs.readFileSync("./ssl-crt/server.crt"),
  key: fs.readFileSync("./ssl-key/server.key" )
}) .listen( 8443, () => {
        console.log(`HTTPS server running on port ${port}`);
        console.log(`✅ Mock WSS server running at wss://localhost:${port}`);
    });  //  http.createServer(app);
 
 
const wss = new IndicesSocket( httpServer);// new WebSocket.Server({ server });
 