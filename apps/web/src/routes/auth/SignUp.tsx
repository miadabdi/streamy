import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Wordmark } from '../../components/Wordmark';
import { useSignUp } from '../../lib/auth';
import { zodResolver } from '../../lib/zodResolver';
import { Field } from './Field';
import { signUpSchema, type SignUpValues } from './schemas';

export function SignUp() {
	const signUp = useSignUp();
	const navigate = useNavigate();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

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
						// Signup creates the account but does NOT set the session cookie
						// (see auth.service.signUp) — sign in right after.
						signUp.mutate(values, { onSuccess: () => navigate('/signin', { replace: true }) }),
					)}
				>
					<div>
						<h1 style={{ margin: 0, fontSize: 20 }}>Create your account</h1>
						<p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-muted)' }}>
							Signing up also creates your first channel — you can add more later.
						</p>
					</div>
					<Field htmlFor="u-email" label="Email" error={errors.email?.message}>
						<input
							className="input"
							id="u-email"
							type="email"
							placeholder="you@home.lan"
							autoComplete="email"
							aria-invalid={errors.email ? true : undefined}
							{...register('email')}
						/>
					</Field>
					<Field
						htmlFor="u-pass"
						label="Password"
						error={errors.password?.message}
						hint={<p className="field-hint">At least 8 characters.</p>}
					>
						<input
							className="input"
							id="u-pass"
							type="password"
							placeholder="••••••••"
							autoComplete="new-password"
							aria-invalid={errors.password ? true : undefined}
							{...register('password')}
						/>
					</Field>
					<hr className="hr" style={{ margin: '2px 0' }} />
					<h6 style={{ margin: 0 }}>Your first channel</h6>
					<Field
						htmlFor="u-username"
						label="Channel username"
						error={errors.channel?.username?.message}
						// Template hint said 3–100 incl. dash; the backend DTO is 8–128, [a-zA-Z0-9._].
						hint={
							<p className="field-hint mono">
								8–128 characters · a–z, 0–9, dot, underscore · no _ or . at the start or end
							</p>
						}
					>
						<input
							className="input"
							id="u-username"
							placeholder="nightwatch"
							aria-invalid={errors.channel?.username ? true : undefined}
							{...register('channel.username')}
						/>
					</Field>
					<Field htmlFor="u-display" label="Display name" error={errors.channel?.name?.message}>
						<input
							className="input"
							id="u-display"
							placeholder="Night Watch"
							aria-invalid={errors.channel?.name ? true : undefined}
							{...register('channel.name')}
						/>
					</Field>
					<Field
						htmlFor="u-desc"
						label="Description"
						error={errors.channel?.description?.message}
					>
						<textarea
							className="input"
							id="u-desc"
							placeholder="What this channel is for."
							aria-invalid={errors.channel?.description ? true : undefined}
							{...register('channel.description')}
						/>
					</Field>
					{signUp.isError && (
						<p className="field-error" role="alert">
							{signUp.error.message}
						</p>
					)}
					<button className="btn btn-primary btn-block" type="submit" disabled={signUp.isPending}>
						Create account &amp; channel
					</button>
					<p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)' }}>
						Already have one? <Link to="/signin">Sign in</Link>
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
