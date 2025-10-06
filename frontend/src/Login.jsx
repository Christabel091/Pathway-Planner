import './Login.css';

export default function Login() {
    return (
        <div className="outer-container">
            <div className="box">
                <h2 className="login">Login</h2>
                <form>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label fw-semibold">Name</label>
                        <input type="text" className="form-control" id="name" placeholder="Your full name" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="id" className="form-label fw-semibold">ID</label>
                        <input type="text" className="form-control" id="id" placeholder="Your Pathways ID" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label fw-semibold">Email</label>
                        <input type="email" className="form-control" id="email" placeholder="name@example.com" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label fw-semibold">Password</label>
                        <input type="password" className="form-control" id="password" />
                    </div>
                    <div className="mb-3">
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Role</label>
                            <div className="dropdown-center">
                                <button
                                    className="btn btn-secondary dropdown-toggle w-100"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    Select role
                                </button>
                                <ul className="dropdown-menu w-100">
                                    <li><a className="dropdown-item" href="#">Patient</a></li>
                                    <li><a className="dropdown-item" href="#">Physician</a></li>
                                    <li><a className="dropdown-item" href="#">Caretaker</a></li>
                                    <li><a className="dropdown-item" href="#">Admin</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label fw-semibold">Don't have an account? <a href = 'https://youtu.be/xvFZjo5PgG0?si=CVAQjqqrSpcedS_W'>Register </a></label>
                    </div>
                    <button type="submit" className="submit">Sign in</button>
                </form>
            </div>
        </div>
    );
}

//add regiter option instead of login