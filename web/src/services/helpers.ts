// function debounce(func: Function, timeout = 300){
//     let timer = 0;
//     return (...args: any) => {
//       clearTimeout(timer)
//       timer = window.setTimeout(() => { func.apply(this, args); }, timeout);
//     };
//   }

export const debounce = (fn: Function, ms = 300) => {
    let timeoutId: ReturnType<typeof setTimeout>
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn.apply(this, args), ms)
    }
}