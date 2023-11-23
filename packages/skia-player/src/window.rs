use glfw::{Action, Context, Monitor, MouseButton};
use skia_safe::gpu::gl::FramebufferInfo;
use tracing::*;

pub struct Window<T = ()> {
    window: glfw::Window,
    surface: skia_safe::Surface,
    gr_context: skia_safe::gpu::DirectContext,
    glfw: glfw::Glfw,
    events: std::sync::mpsc::Receiver<(f64, glfw::WindowEvent)>,
    rx: std::sync::mpsc::Receiver<T>,
}

pub enum WindowEvent<T = ()> {
    WindowResize(i32, i32),
    WindowRedraw,
    WindowScale(f32, f32),
    MouseMove(f64, f64),
    MouseLeftDown,
    MouseLeftUp,
    MouseRightDown,
    MouseRightUp,
    
    VSyncEnabled(bool),

    UserEvent(T),
}

impl<T> Window<T> {
    const FB_INFO: FramebufferInfo = FramebufferInfo {
        fboid: 0,
        format: 0x8058, // RGBA8
        protected: skia_safe::gpu::Protected::No,
    };

    pub fn new(rx: std::sync::mpsc::Receiver<T>) -> Self {
        let mut glfw = glfw::init_no_callbacks().unwrap();
        // let monitor = Monitor::from_primary();
        // let (monitor_width, monitor_height) = dbg!(monitor.get_physical_size());
        let (window, events) = glfw
            .create_window(1366, 768, "AMLL Player (Skia)", glfw::WindowMode::Windowed)
            .unwrap();

        window.get_content_scale();

        glfw.make_context_current(Some(&window));

        let interface = skia_safe::gpu::gl::Interface::new_native().unwrap();

        let mut gr_context = skia_safe::gpu::DirectContext::new_gl(Some(interface), None).unwrap();

        let surface = Self::create_surface(&window, Self::FB_INFO, &mut gr_context);
        Self {
            window,
            surface,
            glfw,
            gr_context,
            events,
            rx,
        }
    }

    pub fn canvas(&mut self) -> &skia_safe::Canvas {
        self.surface.canvas()
    }

    pub fn run(&mut self, mut on_events: impl FnMut(&mut Self, WindowEvent<T>)) {
        self.window.make_current();
        let mut vsync = true;
        on_events(self, WindowEvent::VSyncEnabled(true));
        self.window.set_all_polling(true);
        {
            let (w, h) = self.window.get_framebuffer_size();
            on_events(self, WindowEvent::WindowResize(w, h));
        }
        while !self.window.should_close() {
            on_events(self, WindowEvent::WindowRedraw);
            self.gr_context
                .flush_and_submit_surface(&mut self.surface, false);
            self.window.swap_buffers();
            self.glfw.poll_events();
            for event in self.rx.try_iter().collect::<Vec<_>>() {
                on_events(self, WindowEvent::UserEvent(event));
            }
            for (_, event) in self.events.try_iter().collect::<Vec<_>>() {
                match event {
                    glfw::WindowEvent::Size(_, _) => {
                        if self.window.is_visible() {
                            self.surface = Self::create_surface(
                                &self.window,
                                Self::FB_INFO,
                                &mut self.gr_context,
                            );
                            let (w, h) = self.window.get_framebuffer_size();
                            on_events(self, WindowEvent::WindowResize(w, h));
                        }
                    }
                    glfw::WindowEvent::CursorPos(x, y) => {
                        on_events(self, WindowEvent::MouseMove(x as _, y as _));
                    }
                    glfw::WindowEvent::MouseButton(btn, action, _modifier) => match btn {
                        MouseButton::Button1 => match action {
                            Action::Press => {
                                on_events(self, WindowEvent::MouseLeftDown);
                            }
                            Action::Release => {
                                on_events(self, WindowEvent::MouseLeftUp);
                            }
                            _ => {}
                        },
                        MouseButton::Button2 => match action {
                            Action::Press => {
                                on_events(self, WindowEvent::MouseRightDown);
                            }
                            Action::Release => {
                                on_events(self, WindowEvent::MouseRightUp);
                            }
                            _ => {}
                        },
                        _ => {}
                    },
                    glfw::WindowEvent::Key(key, code, action, _modifier) => {
                        if action == Action::Press {
                            match key {
                                glfw::Key::V => {
                                    vsync = !vsync;
                                    on_events(self, WindowEvent::VSyncEnabled(vsync));
                                    if vsync {
                                        self.glfw.set_swap_interval(glfw::SwapInterval::Sync(1));
                                    } else {
                                        self.glfw.set_swap_interval(glfw::SwapInterval::None);
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                    glfw::WindowEvent::Refresh => {}
                    glfw::WindowEvent::Close => {
                        self.window.set_should_close(true);
                    }
                    _ => {}
                }
            }
        }
    }

    fn create_surface(
        win: &glfw::Window,
        fb_info: FramebufferInfo,
        gr_context: &mut skia_safe::gpu::DirectContext,
    ) -> skia_safe::Surface {
        let size = win.get_framebuffer_size();
        let size = (size.0 as _, size.1 as _);
        let backend_render_target =
            skia_safe::gpu::backend_render_targets::make_gl(size, 0, 0, fb_info);
        skia_safe::gpu::surfaces::wrap_backend_render_target(
            gr_context,
            &backend_render_target,
            skia_safe::gpu::SurfaceOrigin::BottomLeft,
            skia_safe::ColorType::RGBA8888,
            None,
            None,
        )
        .unwrap()
    }
}
