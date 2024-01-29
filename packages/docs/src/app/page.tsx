"use client";
import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";

export default function MainPage() {
    const router = useRouter();
    useLayoutEffect(() => {
        router.replace("/zh-CN");
    }, [])
	return (
        <></>
	);
}
