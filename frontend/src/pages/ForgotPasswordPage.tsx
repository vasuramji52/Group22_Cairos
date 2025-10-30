import AuthPageLayout from '../components/AuthPageLayout.tsx';
import ForgotPasswordForm from '../components/ForgotPasswordForm.tsx';

const ForgotPasswordPage = () => {
  return (
    <AuthPageLayout tagline="We will send a reset link if the account exists.">
      <ForgotPasswordForm />
    </AuthPageLayout>
  );
};

export default ForgotPasswordPage;
