'use client';

import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { captureServerError } from '@/lib/sentry';

export default function Error({ error, reset }) {
  useEffect(() => {
    if (error) {
      captureServerError(error, { scope: 'app_error_boundary' });
    }
  }, [error]);

  return (
    <Box p={4}>
      <Typography variant="h5" mb={1}>Something went wrong</Typography>
      <Typography color="text.secondary" mb={2}>Please retry. The event has been logged for monitoring.</Typography>
      <Button variant="contained" onClick={reset}>Try again</Button>
    </Box>
  );
}