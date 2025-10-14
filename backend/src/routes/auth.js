import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


//ensuring the access for env
import dotenv from "dotenv";
dotenv.config();


//connecting the database
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


//secret key for the JWT, the contetn is in the env
const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();


//================= signup route ============================
router.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;

  //hashing will be done at the fronteend fr security

  //ensuring the data input
  if(!email || !username || !password){
    return res.status(400).json({ error: "Please enter your infromation" }); 
  }

    //debuggins, its actually going in
    console.log("Username:" , username, "Email:", email, "Password:", password)

    //hashing the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    //actual signing up process

    try{
        //making sure the user is not already signed up 
        // by searching from the email data
        const existingUser = await prisma.user.findUnique({where : {email} });

        if(existingUser){
            return res.status(400).json({error : "User already exists!"})
        }

        const validRoles = ["patient", "physician", "caretaker", "admin"];
          if (!validRoles.includes(role)) {
          return res.status(400).json({error : "Please select a role"})
        }

        //loading the new user infomation to the database
        const newUser = await prisma.user.create(
            {
                data : 
                {
                    // prisma's way of writing
                    // INSERT INTO users (username, email, password, role) VALUES (...)
                    // patient is used as the default value for the role
                    UserName : username, email, password_hash: hashedPassword, role: role || "patient" 
                } 
            });
        //when user is succcessfully registered
        console.log("User Registered: ", newUser, email);
        
        // Creating a token for a new user
        const token = jwt.sign(
            { email: newUser.email, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );


         return res.status(201).json({ message: "Signup successful!", token });
    }
    

    //if anything goes wrong 
    catch(err){
         console.error("Signup Error: ", err);
         res.status(500).json({error: "Server Error"});
    }
});

//============================================



// ========== LogIn Route =====================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

 //debugging
  console.log("Login route hit");
  console.log("Email:", email, "Password:", password);

  //ensuring email and password is inserted
    if(!email || !password){
        return res.status(400).json({ error: "Please enter your email and password" }); 
    }

    // Finding the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If no user found, return error
    if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
    } 

    //if user is found, then the password is checked
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    //if password is not correct, leave 
    if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password" });
    }

    // if comes to this point, username and password is correct
    // creating the token for the valid user
    const token = jwt.sign(
      { email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    
    
    //debugging, ensuring token
    console.log("Generated token:", token);
    //debugging, login successfull
    return res.json({
    message: "Login successful!",
    token,
    user: {
      id: user.id,
      username: user.UserName,
      email: user.email,
      role: user.role,
    },
});
  console.log("Sent to the frontend");
  
});
// ===============================================


//========== Protected Route =====================
router.get("/protected", (req, res) => {

    //grabbing the header
  const authHeader = req.headers.authorization; 

//if not authentication header, out
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  //isolating the token
    const token = authHeader.split(" ")[1]; // remove the "Bearer " part

  try {

    //encyripting and verifying the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: "Access granted!", user: decoded });
  } 
  
  catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
});
// =================================

export default router;


