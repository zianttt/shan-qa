import { Typography } from '@mui/material'
import React from 'react'
import { Link } from 'react-router-dom'

function Logo() {
  return (
    <div style={{
        display: "flex",
        marginRight: "auto",
        alignItems: "center",
        gap: "1rem",
    }}>
        <Link to={"/"}>
            <img src="/logo.png" alt="logo" width="25rem" height="25rem" className='image-inverted'/>
        </Link>
        <Typography sx={{display: {md: "block", sm: "none", xs: "none"}, mr: "auto", fontWeight: "800", textShadow: "2px 2px 20px #000"}}>
            <span style={{fontSize: "1rem"}}>SHAN</span>-GPT
        </Typography>
    </div>
  )
}

export default Logo