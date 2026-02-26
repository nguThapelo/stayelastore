'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  CssBaseline,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Slider,
  Snackbar,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const theme = createTheme({
  palette: {
    primary: { main: '#fb8c00' },
    secondary: { main: '#2e7d32' },
    info: { main: '#1565c0' },
    background: { default: '#f5f7fb' },
  },
  shape: { borderRadius: 14 },
});

const defaultForm = {
  name: '',
  storeName: '',
  gautengLocation: '',
  phone: '',
  email: '',
  bankAccount: '',
  weeklyTarget: 500,
  initialCreditHistory: '',
};

const currency = (value) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(
    Number(value || 0)
  );

const cleanFieldProps = {
  fullWidth: true,
  variant: 'outlined',
  size: 'small',
  InputLabelProps: { shrink: true },
};

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [agent, setAgent] = useState(null);
  const [dailySales, setDailySales] = useState(100);
  const [calculation, setCalculation] = useState(null);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [lookupEmail, setLookupEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openPopup, setOpenPopup] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const gridColumns = useMemo(
    () => [
      { field: 'rank', headerName: '#', width: 60 },
      { field: 'storeName', headerName: 'Store', flex: 1, minWidth: 130 },
      { field: 'location', headerName: 'Location', flex: 1, minWidth: 120 },
      { field: 'cashFlow', headerName: 'Cash Flow', flex: 1, minWidth: 120 },
      { field: 'creditScore', headerName: 'Credit Score', flex: 1, minWidth: 110 },
    ],
    []
  );

  const repaymentChartData = useMemo(() => {
    const schedule = calculation?.loan?.repaymentSchedule || [];
    return {
      labels: schedule.map((item) => `M${item.month}`),
      datasets: [
        {
          label: 'Outstanding Balance',
          data: schedule.map((item) => Number(item.balanceAfterPayment || 0)),
          borderColor: '#1565c0',
          backgroundColor: 'rgba(21,101,192,0.2)',
          tension: 0.2,
        },
      ],
    };
  }, [calculation]);

  const dailyChartData = useMemo(() => {
    const rows = dailyHistory.slice(-7);
    return {
      labels: rows.map((item) => item.date),
      datasets: [
        {
          label: 'Daily Sales',
          data: rows.map((item) => Number(item.dailySales || 0)),
          borderColor: '#fb8c00',
          backgroundColor: 'rgba(251,140,0,0.2)',
          tension: 0.25,
        },
        {
          label: 'Profit',
          data: rows.map((item) => Number(item.profit || 0)),
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46,125,50,0.2)',
          tension: 0.25,
        },
      ],
    };
  }, [dailyHistory]);

  const showAlert = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.data);
      }
    } catch (error) {
      showAlert('Failed to load leaderboard', 'error');
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem('townshipBankEmail');
    if (rememberedEmail) {
      setLookupEmail(rememberedEmail);
    }
  }, []);

  const loadExistingProfile = async (emailToLoad) => {
    const normalized = String(emailToLoad || '').trim().toLowerCase();
    if (!normalized) {
      showAlert('Enter email to load profile', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/onboarding/register?email=${encodeURIComponent(normalized)}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Profile not found');
      }

      const profile = data.data;
      setAgent(profile);
      setCalculation(profile.latestCalculation || null);
      setDailyHistory(Array.isArray(profile.dailyEntries) ? profile.dailyEntries : []);
      setFormData((previous) => ({
        ...previous,
        name: profile.name || previous.name,
        storeName: profile.storeName || previous.storeName,
        gautengLocation: profile.gautengLocation || previous.gautengLocation,
        email: profile.email || normalized,
        weeklyTarget: Number(profile.weeklyTarget || previous.weeklyTarget || 500),
      }));
      setLookupEmail(profile.email || normalized);
      window.localStorage.setItem('townshipBankEmail', profile.email || normalized);
      showAlert('Profile loaded. Real-time data synced.', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!agent?.email) {
      return;
    }

    const interval = setInterval(() => {
      loadExistingProfile(agent.email);
    }, 12000);

    return () => clearInterval(interval);
  }, [agent?.email]);

  const handleOnboard = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Onboarding failed');
      }
      setAgent(data.data);
      setLookupEmail(String(formData.email).trim().toLowerCase());
      window.localStorage.setItem('townshipBankEmail', String(formData.email).trim().toLowerCase());
      showAlert('Onboarding completed. Daily input is unlocked.', 'success');
      await loadLeaderboard();
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!agent) {
      showAlert('Complete onboarding first', 'warning');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/financial-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailySales: Number(dailySales),
          weeklyTarget: Number(formData.weeklyTarget),
          agentId: agent.id,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Calculation failed');
      }
      setCalculation(data.data);
      await loadExistingProfile(agent.email || formData.email);
      setOpenPopup(true);
      showAlert('advisory calculation updated', 'success');
      await loadLeaderboard();
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const increaseWeeklyTarget = async () => {
    if (!agent?.email) {
      showAlert('Load or register profile first', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/register', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agent.email,
          weeklyTarget: Number(formData.weeklyTarget),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not update weekly target');
      }

      setAgent(data.data);
      setFormData((previous) => ({ ...previous, weeklyTarget: Number(data.data.weeklyTarget || previous.weeklyTarget) }));
      showAlert('Weekly target increased and saved', 'success');
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startStripeCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 19900,
          customerEmail: formData.email,
          storeName: formData.storeName || 'Township Store',
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Stripe checkout unavailable');
      }
      window.location.href = data.url;
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Typography variant="h4" fontWeight={800} color="primary.main" mb={1}>
            Modern Township Banking
          </Typography>
          <Typography color="text.secondary">Loading dashboard...</Typography>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" fontWeight={800} color="primary.main" mb={1}>
          Township Banking
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Platform for township entrepreneurs.
        </Typography>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Returning User - Load Saved Profile</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                {...cleanFieldProps}
                label="Registered Email Address"
                type="email"
                placeholder="you@store.co.za"
                helperText="Use the same email you used during registration"
                value={lookupEmail}
                onChange={(event) => setLookupEmail(event.target.value)}
              />
              <Button variant="outlined" onClick={() => loadExistingProfile(lookupEmail)} disabled={loading}>
                Load My Real-Time Data
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              1. Onboarding - Register Your Entrepreneur Profile
            </Typography>
            <Box component="form" onSubmit={handleOnboard}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...cleanFieldProps}
                    required
                    label="Full Name"
                    placeholder="e.g. Thabo Mokoena"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...cleanFieldProps}
                    required
                    label="Store Name"
                    placeholder="e.g. Kasi Fresh Mart"
                    value={formData.storeName}
                    onChange={(event) => setFormData({ ...formData, storeName: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...cleanFieldProps}
                    required
                    label="Gauteng Location"
                    placeholder="e.g. Soweto"
                    value={formData.gautengLocation}
                    onChange={(event) => setFormData({ ...formData, gautengLocation: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...cleanFieldProps}
                    required
                    label="Phone Number"
                    placeholder="e.g. 0821234567"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...cleanFieldProps}
                    required
                    label="Email Address"
                    type="email"
                    placeholder="you@store.co.za"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...cleanFieldProps}
                    required
                    label="Bank Account"
                    placeholder="Enter account number"
                    autoComplete="off"
                    value={formData.bankAccount}
                    onChange={(event) => setFormData({ ...formData, bankAccount: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography gutterBottom>Weekly Target: {currency(formData.weeklyTarget)}</Typography>
                  <Slider
                    min={500}
                    max={50000}
                    step={100}
                    value={formData.weeklyTarget}
                    onChange={(_, value) => setFormData({ ...formData, weeklyTarget: Number(value) })}
                  />
                  {agent && (
                    <Button sx={{ mt: 1 }} variant="outlined" onClick={increaseWeeklyTarget} disabled={loading}>
                      Save Increased Weekly Target
                    </Button>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    {...cleanFieldProps}
                    required
                    label="Initial Credit History"
                    placeholder="e.g. No defaults, 1 micro-loan repaid"
                    helperText="Briefly describe your past credit behavior"
                    value={formData.initialCreditHistory}
                    onChange={(event) => setFormData({ ...formData, initialCreditHistory: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" fullWidth disabled={loading}>
                    Register Entrepreneur Profile
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              2. Daily Input
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                fullWidth
                label="Daily Sales (ZAR)"
                type="number"
                value={dailySales}
                onChange={(event) => setDailySales(event.target.value)}
              />
              <Button variant="contained" color="secondary" onClick={handleCalculate} disabled={loading || !agent}>
                Run Financial Advisor
              </Button>
            </Stack>
            {calculation && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined"><CardContent><Typography>Expenses</Typography><Typography variant="h6">{currency(calculation.expenses)}</Typography></CardContent></Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined"><CardContent><Typography>Tax</Typography><Typography variant="h6">{currency(calculation.sarsTaxEstimate)}</Typography></CardContent></Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined"><CardContent><Typography>Credit Score</Typography><Typography variant="h6">{calculation.creditScore}</Typography></CardContent></Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined"><CardContent><Typography>Loan</Typography><Typography variant="h6">{currency(calculation.loan.amount)}</Typography><Typography>{currency(calculation.loan.monthlyRepayment)}/mo</Typography></CardContent></Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined"><CardContent><Typography>Car</Typography><Typography variant="h6">{currency(calculation.carAffordability.maxCarPrice)}</Typography><Typography>{calculation.carAffordability.affordable ? 'Affordable' : 'Needs stronger cash flow'}</Typography></CardContent></Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined"><CardContent><Typography>Bond</Typography><Typography variant="h6">{currency(calculation.bondQualification.maxBond)}</Typography><Typography>{calculation.bondQualification.qualifies ? 'Qualified' : 'Not qualified yet'}</Typography></CardContent></Card>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              3. Dashboard
            </Typography>
            <Box sx={{ height: 320, width: '100%' }}>
              <DataGrid
                rows={leaderboard}
                columns={gridColumns}
                disableRowSelectionOnClick
                pageSizeOptions={[5]}
                initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
              />
            </Box>
            {calculation?.loan?.repaymentSchedule?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Loan Repayment Trend</Typography>
                <Line data={repaymentChartData} />
              </Box>
            )}
            {dailyHistory.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Daily Real-Time Performance (Last 7)</Typography>
                <Line data={dailyChartData} />
              </Box>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" mb={1}>4. Platform Payment (Stripe)</Typography>
            <Typography color="text.secondary" mb={2}>Starter subscription: R199/month</Typography>
            <Button variant="contained" color="info" onClick={startStripeCheckout} disabled={loading}>
              Pay with Stripe
            </Button>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={openPopup} onClose={() => setOpenPopup(false)} fullWidth maxWidth="md">
        <DialogTitle>Advisory Result Popup</DialogTitle>
        <DialogContent>
          <Typography whiteSpace="pre-wrap">{calculation?.narrative || 'No advisory summary available yet.'}</Typography>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}