import AuthPageLayout from '../components/AuthPageLayout.tsx';
import Register from '../components/Register.tsx';

const RegisterPage = () => {
  return (
    <AuthPageLayout tagline="Begin your journey with CAIROS">
      <Register />
    </AuthPageLayout>
  );
};

export default RegisterPage;
