const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const Redis = require('redis');

const redisClient = Redis.createClient();
const DEFEAULT_EXPIRATION = 3600;

app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send('Hii👋!')
})

app.get('/photos',async (req,res)=>{
 const albumId = req.query.albumId;
  const photos = await getOrSetCache(`photos?albumId=${albumId}`,async()=>{
    const {data} = await axios.get('https://jsonplaceholder.typicode.com/photos',{params:{albumId}});
    return data
  })
  res.json(photos)
})

app.get('/photo/:id',async(req,res)=>{
    const photo = await getOrSetCache(`photos:${req.params.id}`,async()=>{
        const {data} = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`);
        return data
    })
    res.json(photo)
})

function getOrSetCache(key,cb){
    return new Promise((resolve,reject) =>{
         redisClient.get(key,async(error,data)=>{
             if(error) return reject(error)
             if(data != null){
                 return resolve(JSON.parse(data));
             }
             const freshData = await cb();
             redisClient.setex(key,DEFEAULT_EXPIRATION,JSON.stringify(freshData))
             resolve(freshData)
         })
    })
}

const PORT = process.env.PORT || 9000

app.listen(PORT,()=>console.log(`Server listening at ${PORT}`))