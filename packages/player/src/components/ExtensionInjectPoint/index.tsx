import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Callout } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import { type ComponentType, type FC, useMemo } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { loadedExtensionAtom } from "../../states/extension.ts";

const ErrorCallout: FC<
	FallbackProps & {
		injectPointName: string;
		id: string;
	}
> = ({ error, id, injectPointName }) => {
	return (
		<Callout.Root>
			<Callout.Icon>
				<ExclamationTriangleIcon />
			</Callout.Icon>
			<Callout.Text>
				<div>
					<Trans i18nKey="extension.inject.error.calloutText">
						扩展程序 {id} 在注入组件 / 功能到 {injectPointName} 槽位时发生错误：
					</Trans>
				</div>
				<div>{error}</div>
			</Callout.Text>
		</Callout.Root>
	);
};

export const ExtensionInjectPoint: FC<{
	injectPointName: string;
	hideErrorCallout?: boolean;
}> = ({ injectPointName, hideErrorCallout }) => {
	const loadedExtension = useAtomValue(loadedExtensionAtom);
	const injectedPoint = useMemo(
		() =>
			loadedExtension
				.map(
					(v) =>
						[
							v.extensionMeta.id,
							v.context.registeredInjectPointComponent[injectPointName],
						] as [string, ComponentType],
				)
				.filter((v) => !!v[1]),
		[loadedExtension, injectPointName],
	);
	const { t } = useTranslation();

	return injectedPoint.map(([id, InjectedComponent]) => (
		<ErrorBoundary
			key={`inject-point-${injectPointName}-${id}`}
			onError={(error, _info) => {
				toast.error(
					t(
						"extension.inject.error.toastText",
						"扩展程序 {id} 在注入组件 / 功能到 {injectPointName} 槽位时发生错误：\n{error}",
						{
							id,
							injectPointName,
							error: String(error),
						},
					),
				);
			}}
			fallbackRender={() => (hideErrorCallout ? null : <ErrorCallout />)}
		>
			<InjectedComponent />
		</ErrorBoundary>
	));
};
