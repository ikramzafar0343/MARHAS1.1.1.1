import React from 'react';
import { Link } from 'react-router-dom';
import { Section, Container, Stack } from '../components/ui/Layout';
import { DisplayHero, HeadingM } from '../components/ui/Typography';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <Section spacing="none" className="h-screen flex items-center justify-center bg-brand-bg">
      <Container>
        <Stack align="center" justify="center" gap="xl" className="text-center">
          <DisplayHero className="text-brand-secondary opacity-50">
            404
          </DisplayHero>
          <HeadingM className="text-2xl md:text-3xl">
            Page Not Found
          </HeadingM>
          <Link to="/">
            <Button variant="primary">Return to Maison</Button>
          </Link>
        </Stack>
      </Container>
    </Section>
  );
};

export default NotFound;
