import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import cookieParser from "cookie-parser";
import multer from "multer";

const app = express();
const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "capitals",
  password: "[{(4better)}]",
  port: 5432,
};

//configuring multer
const storage=multer.memoryStorage();
const upload =multer({storage});





app.set('view engine','ejs')



app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  session({
    secret:"strong-key",
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false,
    maxAge:360000
  //maxAge defines the duration of the session}
  }}
  )
)
app.get("/",(req,res)=>{
    res.render("home.ejs");
})

app.get("/register",(req,res)=>{
    res.render("register.ejs");
})
app.get("/login",(req,res)=>{
  req.session.destroy();
  res.render("login.ejs")
})



app.get("/views/userreg.ejs",(req,res)=>{
  const usermode =req.session.mode;
  if(usermode=="admin"){
    res.render("userreg.ejs")
  }else{
    res.send("Not authenticated")
  }
})

app.get("views\\class2.ejs",(req,res)=>{

  if(req.session.authenticated){
    res.render("class2.ejs");
  }else{
    res.send("Not authenticated");
  }
})



app.post("/login", async (req, res) => {
  const username = req.body["username"];
  const password = req.body["password"];
  const salt = await bcrypt.genSalt(5);
  const hash = await bcrypt.hash(password, salt);
  const db = new pg.Client(dbConfig);

  try {
      await db.connect();
      const result = await db.query("SELECT * FROM userlogin WHERE uname =$1", [username]);
      const storedHash = result.rows[0].upassword;
      const mode = result.rows[0].umode;
      const sec = result.rows[0].div;
      req.session.sec=sec
      req.session.mode=mode

      if (await bcrypt.compare(password, storedHash)) {
        
        res.render("homepg.ejs")
          
      } else {
          res.send("Username or password doesn't match");
          return; // Exit the function early if password doesn't match
      }
  } catch (err) {
      console.error("Error carrying out the query", err);
      res.status(500).send("Internal Server Error");
      return; // Exit the function early in case of an error
  } finally {
      db.end((endErr) => {
          if (endErr) {
              console.error("Connection couldn't be terminated");
          } else {
              console.log("Connection closed successfully");
          }
          // No need to check req.session.authenticated here
          // Render the home page here after ensuring the database connection is closed
          
      });
  }
});


// Handles get requests to cy
app.get("/views/cy.ejs", (req, res) => {
  const userSec = req.session.sec;
  const userMode = req.session.mode;

      if (userMode == 'admin' || (userMode !== 'admin' && userSec == "CY")) {
          res.render("cy.ejs");
      } else {
          res.send("Unauthorized access");
      }
  
});

// Handles get requests to cse
app.get("/views/cse.ejs", (req, res) => {
  const userSec = req.session.sec;
  const userMode = req.session.mode;

      if (userMode === 'admin' || (userMode !== 'admin' && userSec === "CSE")) {
          res.render("cy.ejs");
      } else {
          res.send("Unauthorized access");
      }
  
});

//handles get requests to cd
app.get("/views/cd.ejs",(req,res)=>{ 
  const userSec = req.session.sec;
  const userMode = req.session.mode;

      if (userMode === 'admin' || (userMode !== 'admin' && userSec == "CD")) {
          res.render("cd.ejs");
      } else {
          res.send("Unauthorized access");
      }
  
})


app.get("/views/cym.ejs",(req,res)=>{
 res.render("cym.ejs")
})

app.get("/views/cya.ejs",(req,res)=>{
  const usermode=req.session.mode;
  if(usermode==='admin'||usermode==='teacher'){
    res.render("cya.ejs")
  }else{
    res.send("Unauthorized access")
  }
})


app.post("/register",async (req,res)=>{
    const username=req.body["username"];
    const password=req.body["password"];
    const type=req.body["usertype"]
    const sec=req.body["section"]
    const salt= await bcrypt.genSalt(5);
    const hash=await bcrypt.hash(password,salt);
    const db=new pg.Client(dbConfig);
    try {
        await db.connect();
    
        const result = await db.query("INSERT INTO userlogin VALUES ($1, $2,$3,$4)", [username, hash,type,sec]);
        
        console.log("Query successful");
        
        res.redirect("/");
      } catch (err) {
        console.error("Error executing query", err);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        db.end((endErr) => {
          if (endErr) {
            console.error("Connection couldn't terminate", endErr);
          } else {
            console.log("Connection terminated successfully");
          }
        });
      }
    });
    

    app.post('/upload_material', upload.single('materialUpload'), async (req, res) => {
        const usermode=req.session.mode
        if(usermode!=='teacher'){
          res.send("Unauthorized action")
        }
        const fileName = req.file.originalname;
        const fileData = req.file.buffer;
        const db= new pg.Client(dbConfig)
       try{
        await db.connect();
        // Use the pool to insert the file into the database
        const result = await db.query('INSERT INTO materials (d_name,doc)  VALUES ($1, $2) RETURNING d_id', [fileName, fileData]);
    
        res.status(201).json({ d_id: result.rows[0].id, message: 'File uploaded successfully!' });
      } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } finally {
        db.end((endErr) => {
          if (endErr) {
            console.error("Connection couldn't terminate", endErr);
          } else {
            console.log("Connection terminated successfully");
          }
        });
      }

      
    });
    app.get("/views/cymc.ejs",(req,res)=>{
      const usermode=req.session.mode;
      if(usermode==='teacher'){
        res.render("cym.ejs")
      }else{
        res.redirect("cyms.ejs")
      }
    })

    app.get("/views/cyms.ejs", async (req, res) => {
      const db = new pg.Client(dbConfig);
  
      try {
          await db.connect();
          console.log("Connected to the database");
  
          // Retrieve materials
          const materials = await db.query("SELECT d_id, d_name FROM materials");
          console.log("Materials retrieved from the database:", materials.rows);
  
          // Check if materials are empty
          if (materials.rows.length === 0) {
              console.log("No materials to display");
              res.status(404).send("No materials to display");
              return;
          } else {
              // Render the template with materials
              res.render("cyms.ejs", { materials: materials.rows });
          }
      } catch (error) {
          console.error("Error:", error);
          res.status(500).send("Server error");
      } finally {
          // Close the database connection
          db.end();
      }
  });
  
  app.get('/material/:id', async (req, res) => {
      const materialId = req.params.id;
      const db = new pg.Client(dbConfig);
  
      try {
          await db.connect();
          const result = await db.query('SELECT d_name, doc FROM materials WHERE d_id = $1', [materialId]);
          const material = result.rows[0];
  
          if (!material) {
              res.status(404).send('Material not found');
              return;
          }
  
          // Assuming you want to serve a PDF file, adjust the content type accordingly
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${material.d_name}"`);
          res.send(material.doc);
      } catch (error) {
          console.error('Error retrieving material:', error);
          res.status(500).send('Internal Server Error');
      } finally {
          db.end();
      }
  });
  


    app.listen(3000, () => {
      console.log("Server open..");
    });

    //if (comp.rows[0].password === result.rows[0].password)