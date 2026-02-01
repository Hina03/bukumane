import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  // TODO:
  // 本番環境のURLに変更する
  // ローカル開発中は http://localhost:3000
  const confirmLink = `${process.env.NEXTAUTH_URL}/auth/new-verification?token=${token}`; //これはローカル

  await resend.emails.send({
    from: 'onboarding@resend.dev', // Resendでドメイン認証するまではこのアドレスを使用
    to: email,
    subject: '【重要】メールアドレスの確認',
    html: `<p>以下のリンクをクリックして登録を完了してください。</p><a href="${confirmLink}">ここをクリックして確認</a>`,
  });
};
