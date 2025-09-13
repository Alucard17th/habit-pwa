import { useCallback, useMemo, useState } from "react";
import { updatePassword, updateProfile, verifyLicense } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function useProfile() {
  const { user, refreshUser } = useAuth();

  const [values, setValues] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const canSubmit = useMemo(() => {
    return values.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(values.email);
  }, [values]);

  const onChange = useCallback((k: "name" | "email", v: string) => {
    setValues(s => ({ ...s, [k]: v }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true); setError(null); setFieldErrors({});
    try {
      await updateProfile({ name: values.name.trim(), email: values.email.trim() });
      await refreshUser();
      return { ok: true };
    } catch (e: any) {
      setError(e.message || "Failed to update profile.");
      if (e.fields) setFieldErrors(e.fields);
      return { ok: false };
    } finally {
      setSaving(false);
    }
  }, [values, refreshUser]);

  return { values, onChange, canSubmit, save, saving, error, fieldErrors };
}

export function usePasswordChange() {
  const [values, setValues] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const minLen = 8;

  const canSubmit = useMemo(() => {
    return (
      values.current_password.length >= 1 &&
      values.password.length >= minLen &&
      values.password === values.password_confirmation
    );
  }, [values]);

  const onChange = useCallback((k: keyof typeof values, v: string) => {
    setValues(s => ({ ...s, [k]: v }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true); setError(null); setFieldErrors({});
    try {
      await updatePassword(values);
      return { ok: true };
    } catch (e: any) {
      setError(e.message || "Failed to update password.");
      if (e.fields) setFieldErrors(e.fields);
      return { ok: false };
    } finally {
      setSaving(false);
    }
  }, [values]);

  const reset = () => setValues({ current_password: "", password: "", password_confirmation: "" });

  return { values, onChange, canSubmit, save, saving, error, fieldErrors, reset, minLen };
}

export function useLicenseVerification() {
  const [values, setValues] = useState({ license_key: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [verifiedData, setVerifiedData] = useState<any | null>(null);

  // Keep it lenient: adjust rule if you want
  const canSubmit = useMemo(
    () => values.license_key.trim().length >= 6,
    [values.license_key]
  );

  const onChange = useCallback((v: string) => {
    setValues({ license_key: v });
    setVerifiedData(null);
  }, []);

  const verify = useCallback(async () => {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const data = await verifyLicense({ license_key: values.license_key.trim() });
      setVerifiedData(data); // keep whatever backend returns (plan, expires, etc.)
      return { ok: true, data };
    } catch (e: any) {
      setError(e.message || "Failed to verify license.");
      if (e.fields) setFieldErrors(e.fields);
      return { ok: false };
    } finally {
      setSaving(false);
    }
  }, [values.license_key]);

  const reset = () => {
    setValues({ license_key: "" });
    setVerifiedData(null);
    setError(null);
    setFieldErrors({});
  };

  return { values, onChange, canSubmit, verify, saving, error, fieldErrors, verifiedData, reset };
}