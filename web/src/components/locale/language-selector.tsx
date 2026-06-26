import { BR, US } from 'country-flag-icons/react/3x2'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AppLocale } from '@/i18n'

import { useLocale } from './locale-hooks'

// SVG flags render identically on every OS (native emoji flags fall back to
// "US"/"BR" letters on Windows).
const FLAGS: Record<AppLocale, typeof US> = {
	en: US,
	'pt-BR': BR,
}

export function LanguageSelector() {
	const { locale, setLocale } = useLocale()
	const { t } = useTranslation()

	const CurrentFlag = FLAGS[locale]

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='outline' size='icon'>
					<CurrentFlag aria-hidden className='w-5 rounded-[3px]' />
					<span className='sr-only'>{t('language.label')}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onClick={() => setLocale('en')}>
					<US aria-hidden className='w-5 rounded-[2px]' />
					{t('language.en')}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setLocale('pt-BR')}>
					<BR aria-hidden className='w-5 rounded-[2px]' />
					{t('language.pt-BR')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
