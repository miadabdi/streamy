import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Wordmark } from '../../components/Wordmark';
import { useForgotPassword } from '../../lib/auth';
import { zodResolver } from '../../lib/zodResolver';
import { Field } from './Field';
import { forgotPasswordSchema, type ForgotPasswordValues } from './schemas';

export function ForgotPassword() {
	const forgotPassword = useForgotPassword();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

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
						forgotPassword.mutate(values, {
							onSuccess: (res) => toast.success(res.message),
						}),
					)}
				>
					<div>
						<h1 style={{ margin: 0, fontSize: 20 }}>Forgot password</h1>
						<p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
							We&rsquo;ll email a reset link. It works once and expires.
						</p>
					</div>
					<Field htmlFor="f-email" label="Email" error={errors.email?.message}>
						<input
							className="input"
							id="f-email"
							type="email"
							placeholder="you@home.lan"
							autoComplete="email"
							aria-invalid={errors.email ? true : undefined}
							{...register('email')}
						/>
					</Field>
					{forgotPassword.isError && (
						<p className="field-error" role="alert">
							{forgotPassword.error.message}
						</p>
					)}
					<button
						className="btn btn-primary btn-block"
						type="submit"
						disabled={forgotPassword.isPending}
					>
						Send reset link
					</button>
					<div
						className="toast toast-ok"
						style={{ width: '100%', background: 'transparent', boxShadow: 'none', padding: 0 }}
					>
						<div>
							<div className="toast-note">
								If that address has an account here, the link is on its way. Check the
								instance&rsquo;s mail logs if nothing arrives.
							</div>
						</div>
					</div>
					<p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)' }}>
						<Link to="/signin">Back to sign in</Link>
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
