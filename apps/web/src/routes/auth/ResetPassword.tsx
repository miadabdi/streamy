import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Wordmark } from '../../components/Wordmark';
import { useResetPassword } from '../../lib/auth';
import { zodResolver } from '../../lib/zodResolver';
import { Field } from './Field';
import { resetPasswordSchema, type ResetPasswordValues } from './schemas';

export function ResetPassword() {
	const [searchParams] = useSearchParams();
	const resetPassword = useResetPassword();
	const navigate = useNavigate();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { email: '', token: searchParams.get('token') ?? '', password: '' },
	});

	return (
		<div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
			<div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 22 }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
					<Link to="/" aria-label="Streamy home">
						<Wordmark />
					</Link>
				</div>
				<form
					className="card"
					style={{ gap: 16, padding: 22 }}
					onSubmit={handleSubmit((values) =>
						// The API changes the password but does not start a session —
						// sign in with the new password next.
						resetPassword.mutate(values, { onSuccess: () => navigate('/signin', { replace: true }) }),
					)}
				>
					<div>
						<h1 style={{ margin: 0, fontSize: 20 }}>Set a new password</h1>
						<p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
							The token came from the link in your email.
						</p>
					</div>
					<Field htmlFor="r-email" label="Email" error={errors.email?.message}>
						<input
							className="input"
							id="r-email"
							type="email"
							placeholder="you@home.lan"
							autoComplete="email"
							aria-invalid={errors.email ? true : undefined}
							{...register('email')}
						/>
					</Field>
					<Field
						htmlFor="r-token"
						label="Reset token"
						error={errors.token?.message}
						hint={
							<p className="field-hint">
								Prefilled from the link. Paste it manually if you opened this page directly.
							</p>
						}
					>
						<input
							className="input mono"
							id="r-token"
							aria-invalid={errors.token ? true : undefined}
							{...register('token')}
						/>
					</Field>
					<Field htmlFor="r-pass" label="New password" error={errors.password?.message}>
						<input
							className="input"
							id="r-pass"
							type="password"
							placeholder="••••••••"
							autoComplete="new-password"
							aria-invalid={errors.password ? true : undefined}
							{...register('password')}
						/>
					</Field>
					{resetPassword.isError && (
						<p className="field-error" role="alert">
							{resetPassword.error.message}
						</p>
					)}
					<button
						className="btn btn-primary btn-block"
						type="submit"
						disabled={resetPassword.isPending}
					>
						Change password &amp; sign in
					</button>
					<p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)' }}>
						Link expired? <Link to="/forgot-password">Request a new one</Link>
					</p>
				</form>
				<p
					className="mono"
					style={{ margin: 0, fontSize: 10.5, color: 'var(--color-muted)', textAlign: 'center' }}
				>
					a self-hosted streamy instance · accounts are created by whoever runs it
				</p>
			</div>
		</div>
	);
}
