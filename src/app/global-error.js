'use client';

import { Box, Button, Typography } from '@mui/material';
import { captureServerError } from '@/lib/sentry';

export default function GlobalError({ error, reset }) {
  captureServerError(error, { scope: 'global_error_boundary' });

  return (
    <html lang="en-ZA">
      <body>
        <Box p={4}>
          <Typography variant="h5" mb={1}>Unexpected platform error</Typography>
          <Typography color="text.secondary" mb={2}>Monitoring has captured this error.</Typography>
          <Button variant="contained" onClick={reset}>Try again</Button>
        </Box>
      </body>
    </html>
  );
}