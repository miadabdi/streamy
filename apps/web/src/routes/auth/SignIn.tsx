import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Wordmark } from '../../components/Wordmark';
import { useSignIn } from '../../lib/auth';
import { zodResolver } from '../../lib/zodResolver';
import { Field } from './Field';
import { signInSchema, type SignInValues } from './schemas';

export function SignIn() {
	const signIn = useSignIn();
	const navigate = useNavigate();
	const location = useLocation();
	const next = (location.state as { next?: string } | null)?.next ?? '/';
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

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
						signIn.mutate(values, { onSuccess: () => navigate(next, { replace: true }) }),
					)}
				>
					<div>
						<h1 style={{ margin: 0, fontSize: 20 }}>Sign in</h1>
						<p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
							Welcome back.
						</p>
					</div>
					<Field htmlFor="a-email" label="Email" error={errors.email?.message}>
						<input
							className="input"
							id="a-email"
							type="email"
							placeholder="you@home.lan"
							autoComplete="email"
							aria-invalid={errors.email ? true : undefined}
							{...register('email')}
						/>
					</Field>
					<Field
						htmlFor="a-pass"
						label="Password"
						error={errors.password?.message}
						hint={
							<p className="field-hint">
								<Link to="/forgot-password">Forgot your password?</Link>
							</p>
						}
					>
						<input
							className="input"
							id="a-pass"
							type="password"
							placeholder="••••••••"
							autoComplete="current-password"
							aria-invalid={errors.password ? true : undefined}
							{...register('password')}
						/>
					</Field>
					{signIn.isError && (
						<p className="field-error" role="alert">
							{signIn.error.message}
						</p>
					)}
					<button className="btn btn-primary btn-block" type="submit" disabled={signIn.isPending}>
						Sign in
					</button>
					<p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)' }}>
						No account on this instance? <Link to="/signup">Sign up</Link>
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
