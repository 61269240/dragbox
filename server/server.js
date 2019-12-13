let express=require('express')
// let urlencode=require('urlencode')
// let qs=require('querystring')

let app=new express()

app.use(express.static('../'))

app.get('/hello',(req,res)=>{
    res.send('12345678')
})

app.post('/data',(req,res)=>{
    // console.log('111');
    let data='';
    req.on('data',(buf)=>{
        // console.log('data');
        data+=buf
    })
    req.once('end',()=>{
        // console.log('end');
        // let aa=urlencode.decode(data)
        console.log(data);
        res.send('have received')

    })
})

app.listen(100,(err)=>{
    if(err){
        console.log(err)
    }else{
        console.log('running')
    }
})