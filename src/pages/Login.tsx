// src/pages/Login.tsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { register as apiRegister } from "../lib/api";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, TextField, Button, Typography, Stack, Divider, Alert
} from "@mui/material";

type FieldErrors = Record<string, string[] | string>;

export default function Login(){
  const nav = useNavigate();
  const { login } = useAuth();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [name,setName] = useState("");
  const [loading,setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearErrors = () => { setError(null); setFieldErrors({}); };

  const onLogin = async (e:React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearErrors();
    try {
      await login(email, password);
      nav("/");
    } catch (err:any) {
      setError(err?.message || "Login failed.");
      if (err?.fields) setFieldErrors(err.fields);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e:React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearErrors();
    try {
      await apiRegister({ name: name || "User", email, password });
      await login(email, password);
      nav("/");
    } catch (err:any) {
      setError(err?.message || "Registration failed.");
      if (err?.fields) setFieldErrors(err.fields);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract first message for a field
  const first = (key:string) => {
    const v = fieldErrors?.[key];
    return Array.isArray(v) ? v[0] : v || undefined;
  };

  return (
    <Box sx={{ display:"grid", placeItems:"center", minHeight:"70vh" }}>
      <Paper sx={{ p: 4, width: 380 }}>
        <Typography variant="h5" gutterBottom>Welcome back</Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: .75 }}>
          Sign in or create an account to start tracking habits.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack component="form" spacing={2} onSubmit={onLogin}>
          <TextField
            label="Email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            error={!!first("email")}
            helperText={first("email")}
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            error={!!first("password")}
            helperText={first("password")}
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={loading}>Login</Button>
        </Stack>

        <Divider sx={{ my: 3 }}>or</Divider>

        <Stack component="form" spacing={2} onSubmit={onRegister}>
          <TextField
            label="Name (optional)"
            value={name}
            onChange={e=>setName(e.target.value)}
            error={!!first("name")}
            helperText={first("name")}
            fullWidth
          />
          <Button type="submit" variant="outlined" disabled={loading}>Register & Login</Button>
        </Stack>
      </Paper>
    </Box>
  );
}