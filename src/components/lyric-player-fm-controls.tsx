import { ActionIcon } from "@mantine/core";
import {
	IconDots,
	IconHeart,
	IconHeartBroken,
	IconPlayerSkipForward,
	IconTrash,
} from "@tabler/icons";
import * as React from "react";

export const LyricPlayerFMControls: React.FC = () => {
	const [likeOrUnlike, setLikeOrUnlike] = React.useState<boolean | null>(
		document.querySelector<HTMLButtonElement>(".m-fm .btn_pc_like")?.dataset
			?.action === "like",
	);

	React.useEffect(() => {
		const likeBtn =
			document.querySelector<HTMLButtonElement>(".m-fm .btn_pc_like");
		if (likeBtn) {
			const btnObs = new MutationObserver(() => {
				setLikeOrUnlike(likeBtn?.dataset?.action === "like");
			});
			btnObs.observe(likeBtn, {
				attributes: true,
				attributeFilter: ["data-action"],
			});
			return () => {
				btnObs.disconnect();
			};
		}
	}, []);

	return (
		<div className="am-fm-player-ctl">
			<ActionIcon
				size="xl"
				loading={likeOrUnlike === null}
				onClick={() => {
					setLikeOrUnlike(null);
					document
						.querySelector<HTMLButtonElement>(".m-fm .btn_pc_like")
						?.click();
				}}
			>
				{likeOrUnlike ? <IconHeart size={34} /> : <IconHeartBroken size={34} />}
			</ActionIcon>
			<ActionIcon
				size="xl"
				onClick={() => {
					document
						.querySelector<HTMLButtonElement>(".m-fm [data-action=hate]")
						?.click();
				}}
			>
				<IconTrash size={34} />
			</ActionIcon>
			<ActionIcon
				size="xl"
				onClick={() => {
					document
						.querySelector<HTMLButtonElement>(".m-fm [data-action=next]")
						?.click();
				}}
			>
				<IconPlayerSkipForward size={34} />
			</ActionIcon>
			<ActionIcon
				size="xl"
				onClick={() => {
					document
						.querySelector<HTMLButtonElement>(".m-fm [data-action=more]")
						?.click();
				}}
			>
				<IconDots size={34} />
			</ActionIcon>
		</div>
	);
};
