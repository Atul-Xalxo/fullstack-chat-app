
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.mode.js"
import bcrypt from "bcryptjs"

export const signup =async(req,res)=>{

  const  {fullName,email,password} = req.body;

   try {

    if(!email || !password || !fullName)
      return res.status(400).json({message:"Enter all fields"})

      //hash password
      if(password.length<6){
        return res.status(400).json({message:"Password must be at least 6 character"})
      }

      const user = await User.findOne({email})

      if(user) 
      return res.status(400).json({message:"Email alreaddy exists"})

      const salt = await bcrypt.genSalt(10)
      const hashPassword = await bcrypt.hash(password,salt)

      const newUser = new User({
        fullName,
        email,
        password:hashPassword,
      })

      if(newUser){
        //generate JWT token here
        generateToken(newUser._id,res);
        await newUser.save();

        res.status(201).json({
          _id:newUser._id,
          fullName:newUser.fullName,
          email:newUser.email,
          profilePic:newUser.profilePic,
        })
      }else{
          res.status(400).json({message:"Invalid user data"})
      }

   } catch (error) {
      console.log("Error in signup controller", error.message);
      res.status(500).json({message:"Internal Server Error"})
   }
};

export const login = async(req,res)=>{
  try {
    const { email, password } = req.body;

    const user = await User.findOne({email});
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({message:"Internal server error"})
  }
};

export const logout = (req, res) => {
  try {
   res.cookie("jwt","",{maxAge:0});
   res.status(200).json({message:"Logged out successfully"});
  } catch (error) {
    console.log("Error in logout controller",error.message);
    res.status(500).json({message:"Internal Server Error"});
  }
};

export const updateProfile = async (req,res) =>{
   try {
     const { profilePic } = req.body;
     const userId = req.user._id;

     if (!profilePic) {
       return res.status(400).json({ message: "Profile pic is required" });
     }

     const uploadResponse = await cloudinary.uploader.upload(profilePic);
     const updateUser = await User.findByIdAndUpdate(
       userId,
       { profilePic: uploadResponse.secure_url },
       { new: true }
     );
    
     res.status(200).json(updateUser);
   } catch (error) {
      console.log("error in update profile:",error.message )
      res.status(500).json({message:"Internal Server Error"})
   }
};

export const checkAuth = (req,res)=>{
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller",error.message);
    res.status(500).json({message:"Internal Server Error"});
  }
}
