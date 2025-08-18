export async function delay(milliSeconds: number){
    await new Promise((resolve) => setTimeout(resolve, milliSeconds));
}
