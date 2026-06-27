import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { getUser } from '@/api/get-user'
import { updateUser, type UpdateUserBody } from '@/api/update-user'
import { useAuth } from '@/components/auth/auth-hooks'
import { useSetBreadcrumb } from '@/components/breadcrumb/breadcrumb-hooks'
import { useConfirmDeactivate } from '@/hooks/use-confirm-deactivate'
import { messageFromError } from '@/lib/errors'

const usernamePattern = /^[a-zA-Z0-9_]+$/

const makeEditForm = (t: TFunction<['admin', 'common']>) =>
	z.object({
		username: z
			.string()
			.min(3, t('common:errors.minChars', { count: 3 }))
			.max(30, t('common:errors.maxChars', { count: 30 }))
			.regex(usernamePattern, t('common:errors.usernamePattern')),
		email: z.email(t('common:errors.email')),
		role: z.enum(['USER', 'ADMIN']),
		is_verified: z.boolean(),
		is_active: z.boolean(),
	})
type EditForm = z.infer<ReturnType<typeof makeEditForm>>

export function useUserEditPM() {
	const { userId = '' } = useParams()
	const auth = useAuth()
	const { t, i18n } = useTranslation(['admin', 'common'])
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const deactivate = useConfirmDeactivate()

	// Fetch the user by id so the page stands alone (refresh / direct link).
	const {
		data: user,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['users', userId],
		queryFn: () => getUser(userId),
		enabled: Boolean(userId),
		retry: false,
	})

	// Publish the username as the breadcrumb's dynamic leaf.
	useSetBreadcrumb(user?.username)

	const {
		register,
		control,
		handleSubmit,
		setValue,
		formState: { errors, dirtyFields },
	} = useForm<EditForm>({
		resolver: useMemo(
			() => zodResolver(makeEditForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
		defaultValues: {
			username: '',
			email: '',
			role: 'USER',
			is_verified: false,
			is_active: true,
		},
		// `values` (not a post-mount reset) re-seeds the form when the async user
		// load resolves. It refreshes the Controller-bound Select/Switch too — a
		// reset() inside an effect leaves those stale (register inputs seed, the
		// Controllers don't), so on first open Role/verified came up blank.
		values: user
			? {
					username: user.username,
					email: user.email,
					role: user.role,
					is_verified: user.is_verified,
					is_active: user.is_active,
				}
			: undefined,
	})

	// Rule: changing the email unverifies the account, so the verified toggle is
	// forced off (and disabled in the view) while the email differs. dirtyFields
	// (not a watched value) tells us the email diverged from the seeded baseline
	// — no first-render lag that would wrongly clobber the seeded verified flag.
	const emailChanged = Boolean(dirtyFields.email)
	useEffect(() => {
		if (emailChanged) {
			setValue('is_verified', false)
		}
	}, [emailChanged, setValue])

	const update = useMutation({
		mutationFn: (body: UpdateUserBody) => updateUser(userId, body),
		onSuccess: () => {
			toast.success(t('users.edit.toast.updated'))
			queryClient.invalidateQueries({ queryKey: ['users'] })
			navigate('/admin/users')
		},
		onError: (err) => {
			toast.error(messageFromError(err, t('users.edit.toast.error')))
		},
	})

	function onSubmit(data: EditForm) {
		if (!user) {
			return
		}

		// Send only the changed fields — the backend requires at least one and
		// rejects an email+is_verified:true combination.
		const body: UpdateUserBody = {}
		if (data.username !== user.username) {
			body.username = data.username
		}
		if (data.email !== user.email) {
			body.email = data.email
		}
		if (data.role !== user.role) {
			body.role = data.role
		}
		if (!emailChanged && data.is_verified !== user.is_verified) {
			body.is_verified = data.is_verified
		}
		if (data.is_active !== user.is_active) {
			body.is_active = data.is_active
		}

		if (Object.keys(body).length === 0) {
			toast.info(t('users.edit.noChanges'))
			return
		}

		// Confirm-on-deactivate: prompt before saving when Active goes ON -> OFF;
		// any other edit saves straight through.
		deactivate.guardSave({
			wasActive: user.is_active,
			willBeActive: data.is_active,
			save: () => update.mutate(body),
		})
	}

	return {
		isLoading,
		isError,
		user,
		register,
		control,
		errors,
		// Rule: an admin cannot change their own role.
		isSelf: auth.user?.id === userId,
		emailChanged,
		isSaving: update.isPending,
		handleSubmit: handleSubmit(onSubmit),
		cancel: () => navigate('/admin/users'),
		// Controlled <ConfirmDialog> props for the confirm-on-deactivate prompt.
		confirmDeactivate: deactivate.dialogProps,
	}
}
